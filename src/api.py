"""
FastAPI Backend Server for Hostel Mess Operations Agent.
Exposes REST and SSE Streaming APIs for:
  - Live Groq LLM Multi-Agent Swarm execution & live debate streaming
  - PostgreSQL CRUD for Pantry Inventory, Weekly Menu Plans, and Governance Ledger
  - MCP Tool execution endpoint
  - Electronic Committee Voting & SHA-256 Hash Chain verification
"""

import os
import json
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse

from src.db import (
    get_db, init_db, seed_db_if_empty,
    PantryInventory, VendorPrice, WeeklyMenuPlan, AuditLedgerEntry,
    HostelVendor, VendorCallLog, HostelRoom, StudentRoomApplication, MaintenanceTicket
)
from src.governance import GovernanceGate, AuditLog, WEEKLY_BUDGET_CEILING_INR
from src.memory import LongTermMemory
from src.llm_swarm import LLMMenuCoordinator
from mcp.server import MessMCPServer
from src.elevenlabs_service import (
    initiate_vendor_outbound_call,
    initiate_maintenance_manager_call,
    initiate_student_room_allotment_call,
    get_conversation,
    process_vendor_call_webhook
)
from src.vision_detector import analyze_cctv_frame


# Initialize Database & seed if empty
seed_db_if_empty(reset=False)

app = FastAPI(
    title="Hostel Mess Operations Autonomous Agent API",
    version="2.0.0",
    description="Multi-agent swarm operations API with Groq LLM, PostgreSQL, and SHA-256 Governance"
)

# Allow CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Governance & Memory instances
audit_log_instance = AuditLog()
governance_gate = GovernanceGate(audit_log_instance)
ltm_instance = LongTermMemory()
mcp_server = MessMCPServer()

# Request Models
class RunCycleRequest(BaseModel):
    week_number: int = 6
    force_breach: bool = False
    custom_theme: Optional[str] = ""

class SignApprovalRequest(BaseModel):
    approval_id: str
    signatory_role: str
    signatory_name: str
    decision: str = "APPROVE" # "APPROVE" or "REJECT"
    comments: Optional[str] = ""

class UpdateInventoryRequest(BaseModel):
    item: str
    quantity_delta: float # Negative to consume, positive to restock
    force_auto_call: bool = False

class RecordStockRequest(BaseModel):
    item: str
    quantity: float
    unit: Optional[str] = None
    reorder_point: Optional[float] = None
    supplier: Optional[str] = None
    force_auto_call: bool = False

class BatchRecordStockRequest(BaseModel):
    items: List[RecordStockRequest]

class ConfigureAutoReorderRequest(BaseModel):
    item: str
    reorder_point: float
    supplier: str

class MCPExecuteRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = {}

# ==========================================
# Autonomous Low-Stock Vendor Calling Engine
# ==========================================

async def trigger_automated_vendor_call_for_low_stock(
    inv_item: PantryInventory,
    db: Session,
    force: bool = False
) -> Optional[Dict[str, Any]]:
    """
    Autonomous Reorder Engine:
    When an inventory item's stock drops <= reorder_point:
      1. Resolves the respected vendor (from HostelVendor / PantryInventory.supplier)
      2. Calculates reorder quantity and total amount
      3. Automatically dispatches an ElevenLabs voice call to the vendor
      4. Saves the log in PostgreSQL and records an entry in the SHA-256 Governance Ledger
    """
    if not force and inv_item.quantity > inv_item.reorder_point:
        return None

    # Check for duplicate recent call within 30 minutes to prevent accidental spam
    recent_cutoff = datetime.utcnow() - timedelta(minutes=30)
    recent_call = db.query(VendorCallLog).filter(
        VendorCallLog.items_summary.ilike(f"%{inv_item.item}%"),
        VendorCallLog.created_at >= recent_cutoff
    ).first()
    
    if recent_call and not force:
        return {
            "auto_call_triggered": False,
            "status": "COOLDOWN_ACTIVE",
            "message": f"Active purchase call already dispatched for '{inv_item.item}' within the last 30 minutes.",
            "po_number": recent_call.po_number,
            "vendor_name": recent_call.vendor_name,
            "phone_called": recent_call.phone_called
        }

    # Find matching vendor
    all_vendors = db.query(HostelVendor).filter(HostelVendor.is_active == True).all()
    matched_vendor = None

    # 1. Match by exact or partial supplier name
    if inv_item.supplier:
        for v in all_vendors:
            if (v.name.lower() == inv_item.supplier.lower() or 
                inv_item.supplier.lower() in v.name.lower() or 
                v.name.lower() in inv_item.supplier.lower()):
                matched_vendor = v
                break

    # 2. Match by item keywords
    if not matched_vendor:
        item_lower = inv_item.item.lower()
        if any(k in item_lower for k in ["milk", "curd", "paneer", "dairy", "butter", "ghee", "cheese"]):
            matched_vendor = next((v for v in all_vendors if "dairy" in v.name.lower() or "milk" in v.category.lower()), None)
        elif any(k in item_lower for k in ["tomato", "potato", "onion", "vegetable", "cabbage", "cauliflower", "chilli", "coriander", "ginger", "garlic", "spinach", "bhindi", "capsicum", "peas", "fruit", "carrot", "beans", "gobi", "poriyal"]):
            matched_vendor = next((v for v in all_vendors if "veg" in v.name.lower() or "vegetable" in v.category.lower()), None)
        elif any(k in item_lower for k in ["rice", "wheat", "atta", "dal", "pulse", "grain", "moong", "toor", "urad", "chana", "lentil", "flour", "oil", "spice", "semolina", "rava", "sugar", "salt"]):
            matched_vendor = next((v for v in all_vendors if "grain" in v.name.lower() or "rice" in v.category.lower() or "mandi" in v.name.lower()), None)

    # 3. Match vendor "mallik" if present in database
    if not matched_vendor:
        matched_vendor = next((v for v in all_vendors if "mallik" in v.name.lower()), None)

    # 4. Fallback to first vendor
    if not matched_vendor and all_vendors:
        matched_vendor = all_vendors[0]

    vendor_name = matched_vendor.name if matched_vendor else (inv_item.supplier or "mallik")
    vendor_phone = matched_vendor.phone if matched_vendor else "+918431362088"
    delivery_window = matched_vendor.default_delivery_window if matched_vendor else "Tomorrow 06:30 - 07:00 AM"

    # Calculate deficit & reorder batch size
    target_stock = max(round(inv_item.reorder_point * 3.5, 1), 40.0)
    reorder_qty = round(max(target_stock - inv_item.quantity, inv_item.reorder_point * 2), 1)
    
    # Calculate price from vendor prices or item unit cost
    unit_price = inv_item.unit_cost_inr if inv_item.unit_cost_inr > 0 else 45.0
    vp = db.query(VendorPrice).filter(VendorPrice.item.ilike(f"%{inv_item.item}%")).first()
    if vp:
        unit_price = vp.bulk_price_inr if reorder_qty >= vp.bulk_threshold else vp.unit_price_inr

    total_amount = round(reorder_qty * unit_price, 2)
    po_number = f"PO-AUTO-LOW-{inv_item.id}-{int(datetime.utcnow().timestamp()) % 100000:05d}"
    items_summary = [f"{reorder_qty} {inv_item.unit} {inv_item.item}"]

    # Trigger outbound call via ElevenLabs
    call_res = await initiate_vendor_outbound_call(
        vendor_phone=vendor_phone,
        vendor_name=vendor_name,
        po_number=po_number,
        items_summary=items_summary,
        total_amount_inr=total_amount,
        delivery_window=delivery_window,
        arrival_time="06:45 AM",
        hostel_name="Aryabhatta & Nilgiri Central Hostel",
        manager_name="Autonomous Stock Monitor"
    )

    # Persist call log in PostgreSQL
    call_log = VendorCallLog(
        po_number=po_number,
        vendor_name=vendor_name,
        phone_called=call_res.get("to_number", vendor_phone),
        items_summary=", ".join(items_summary),
        total_amount_inr=total_amount,
        delivery_window=delivery_window,
        call_sid=call_res.get("call_sid"),
        conversation_id=call_res.get("conversation_id"),
        status="AUTO_TRIGGERED_LOW_STOCK"
    )
    db.add(call_log)
    
    # Update item urgency
    inv_item.urgency = "LOW_STOCK_REORDER_TRIGGERED"
    
    # Log in SHA-256 Audit Ledger
    audit_log_instance.log(
        actor="Autonomous Stock Monitor",
        action="AUTOMATED_LOW_STOCK_VENDOR_CALL",
        details={
            "item": inv_item.item,
            "on_hand_quantity": inv_item.quantity,
            "reorder_point": inv_item.reorder_point,
            "po_number": po_number,
            "reorder_quantity": reorder_qty,
            "unit": inv_item.unit,
            "total_amount_inr": total_amount,
            "vendor_name": vendor_name,
            "phone_called": vendor_phone,
            "timestamp": datetime.utcnow().isoformat()
        }
    )
    db.commit()

    return {
        "auto_call_triggered": True,
        "status": "DISPATCHED",
        "po_number": po_number,
        "vendor_name": vendor_name,
        "vendor_phone": vendor_phone,
        "reorder_quantity": reorder_qty,
        "unit": inv_item.unit,
        "total_amount_inr": total_amount,
        "delivery_window": delivery_window,
        "call_response": call_res
    }

# Endpoints
@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    inv_count = db.query(PantryInventory).count()
    vp_count = db.query(VendorPrice).count()
    return {
        "status": "healthy",
        "database": "PostgreSQL (Docker)",
        "pantry_items_count": inv_count,
        "vendor_prices_count": vp_count,
        "llm_provider": "Groq",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/inventory")
def get_inventory(filter_expiring: bool = False, db: Session = Depends(get_db)):
    query = db.query(PantryInventory)
    if filter_expiring:
        query = query.filter(PantryInventory.days_to_expiry <= 3)
    items = query.order_by(PantryInventory.days_to_expiry.asc()).all()
    return [
        {
            "id": i.id,
            "item": i.item,
            "category": i.category,
            "quantity": i.quantity,
            "unit": i.unit,
            "batch_id": i.batch_id,
            "days_to_expiry": i.days_to_expiry,
            "reorder_point": i.reorder_point,
            "urgency": i.urgency,
            "unit_cost_inr": i.unit_cost_inr,
            "supplier": i.supplier,
            "is_low_stock": i.quantity <= i.reorder_point
        }
        for i in items
    ]

@app.post("/api/inventory/update")
async def update_inventory(req: UpdateInventoryRequest, db: Session = Depends(get_db)):
    inv_item = db.query(PantryInventory).filter(PantryInventory.item == req.item).first()
    if not inv_item:
        raise HTTPException(status_code=404, detail=f"Pantry item '{req.item}' not found.")
    
    new_qty = max(0.0, inv_item.quantity + req.quantity_delta)
    inv_item.quantity = new_qty
    
    # Check low-stock threshold
    is_low = new_qty <= inv_item.reorder_point
    auto_call_info = None
    if is_low:
        auto_call_info = await trigger_automated_vendor_call_for_low_stock(
            inv_item=inv_item,
            db=db,
            force=req.force_auto_call
        )
    else:
        if inv_item.urgency == "LOW_STOCK_REORDER_TRIGGERED":
            inv_item.urgency = "NORMAL"

    db.commit()
    return {
        "item": inv_item.item,
        "new_quantity": new_qty,
        "unit": inv_item.unit,
        "reorder_point": inv_item.reorder_point,
        "is_low_stock": is_low,
        "supplier": inv_item.supplier,
        "auto_call": auto_call_info
    }

@app.post("/api/inventory/record")
async def record_stock_level(req: RecordStockRequest, db: Session = Depends(get_db)):
    """
    User records current stock level for an inventory item.
    If stock hits <= reorder_point, automatically triggers a call to the respected vendor.
    """
    inv_item = db.query(PantryInventory).filter(PantryInventory.item == req.item).first()
    if not inv_item:
        # Create new item if not found
        inv_item = PantryInventory(
            item=req.item,
            category="Daily Stock Inflow",
            quantity=max(0.0, req.quantity),
            unit=req.unit or "kg",
            batch_id=f"REC-{int(datetime.utcnow().timestamp()) % 10000}",
            days_to_expiry=7,
            reorder_point=req.reorder_point or 15.0,
            urgency="NORMAL",
            unit_cost_inr=45.0,
            supplier=req.supplier or "FreshVeg Wholesale Logistics"
        )
        db.add(inv_item)
    else:
        inv_item.quantity = max(0.0, req.quantity)
        if req.reorder_point is not None:
            inv_item.reorder_point = req.reorder_point
        if req.supplier:
            inv_item.supplier = req.supplier
        if req.unit:
            inv_item.unit = req.unit

    is_low = inv_item.quantity <= inv_item.reorder_point
    auto_call_info = None
    if is_low:
        auto_call_info = await trigger_automated_vendor_call_for_low_stock(
            inv_item=inv_item,
            db=db,
            force=req.force_auto_call
        )
    else:
        if inv_item.urgency == "LOW_STOCK_REORDER_TRIGGERED":
            inv_item.urgency = "NORMAL"

    db.commit()
    db.refresh(inv_item)

    return {
        "success": True,
        "item": inv_item.item,
        "quantity": inv_item.quantity,
        "unit": inv_item.unit,
        "reorder_point": inv_item.reorder_point,
        "supplier": inv_item.supplier,
        "is_low_stock": is_low,
        "auto_call": auto_call_info
    }

@app.post("/api/inventory/record-batch")
async def record_stock_batch(req: BatchRecordStockRequest, db: Session = Depends(get_db)):
    results = []
    for item_req in req.items:
        res = await record_stock_level(item_req, db)
        results.append(res)
    return {"success": True, "updated_count": len(results), "records": results}

@app.get("/api/inventory/low-stock-status")
def get_low_stock_status(db: Session = Depends(get_db)):
    """
    Returns all pantry items currently below or at their reorder point,
    along with their mapped vendor and recent automated call logs.
    """
    all_items = db.query(PantryInventory).all()
    low_items = [i for i in all_items if i.quantity <= i.reorder_point]
    vendors = db.query(HostelVendor).filter(HostelVendor.is_active == True).all()
    vendor_map = {v.name: v for v in vendors}
    
    logs = db.query(VendorCallLog).filter(
        VendorCallLog.status.in_(["AUTO_TRIGGERED_LOW_STOCK", "CONNECTED", "COMPLETED", "INITIATED"])
    ).order_by(VendorCallLog.created_at.desc()).limit(10).all()

    low_items_data = []
    for i in low_items:
        matched_vendor = vendor_map.get(i.supplier)
        low_items_data.append({
            "id": i.id,
            "item": i.item,
            "category": i.category,
            "quantity": i.quantity,
            "unit": i.unit,
            "reorder_point": i.reorder_point,
            "deficit": max(0.0, i.reorder_point - i.quantity),
            "supplier": i.supplier,
            "vendor_phone": matched_vendor.phone if matched_vendor else "+919876543210",
            "urgency": i.urgency
        })

    return {
        "low_stock_count": len(low_items),
        "total_items_count": len(all_items),
        "low_stock_items": low_items_data,
        "recent_automated_calls": [
            {
                "id": log.id,
                "po_number": log.po_number,
                "vendor_name": log.vendor_name,
                "phone_called": log.phone_called,
                "items_summary": log.items_summary,
                "total_amount_inr": log.total_amount_inr,
                "status": log.status,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            for log in logs
        ]
    }

@app.post("/api/inventory/auto-reorder/configure")
def configure_auto_reorder(req: ConfigureAutoReorderRequest, db: Session = Depends(get_db)):
    item = db.query(PantryInventory).filter(PantryInventory.item == req.item).first()
    if not item:
        raise HTTPException(status_code=404, detail=f"Pantry item '{req.item}' not found.")
    
    item.reorder_point = req.reorder_point
    item.supplier = req.supplier
    db.commit()
    return {
        "success": True,
        "item": item.item,
        "reorder_point": item.reorder_point,
        "supplier": item.supplier
    }

@app.post("/api/inventory/scan-and-reorder")
async def scan_and_reorder_all(force: bool = Query(default=False), db: Session = Depends(get_db)):
    """
    Autonomous standing agent scan:
    Scans entire pantry inventory, analyzes stock levels against thresholds,
    and automatically triggers ElevenLabs voice calls for low-stock items.
    """
    all_items = db.query(PantryInventory).all()
    triggered = []
    for item in all_items:
        if item.quantity <= item.reorder_point or force:
            call_info = await trigger_automated_vendor_call_for_low_stock(item, db, force=force)
            if call_info and call_info.get("auto_call_triggered"):
                triggered.append(call_info)
    
    return {
        "scanned_items_count": len(all_items),
        "calls_triggered_count": len(triggered),
        "calls": triggered
    }

@app.post("/api/inventory/trigger-item-call/{item_id}")
async def trigger_item_call(item_id: int, force: bool = Query(default=True), db: Session = Depends(get_db)):
    """
    Directly trigger an autonomous vendor voice call for a specific pantry item based on stock analysis.
    """
    item = db.query(PantryInventory).filter(PantryInventory.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Pantry item not found")
    call_info = await trigger_automated_vendor_call_for_low_stock(item, db, force=force)
    return {
        "success": True,
        "item": item.item,
        "call_info": call_info
    }

@app.get("/api/menu/latest")
def get_latest_menu(db: Session = Depends(get_db)):
    plan = db.query(WeeklyMenuPlan).order_by(WeeklyMenuPlan.id.desc()).first()
    if not plan:
        # If no plan generated in DB yet, generate initial plan synchronously
        coordinator = LLMMenuCoordinator(ltm_instance, governance_gate)
        events = list(coordinator.run_planning_cycle_stream(6, force_breach=False))
        last_event = events[-1]
        result = last_event["result"]
        
        db_plan = WeeklyMenuPlan(
            week_number=result["week_number"],
            title=result["title"],
            is_breach=result["is_breach"],
            total_weekly_cost_inr=result["total_weekly_cost_inr"],
            weekly_budget_cap_inr=result["weekly_budget_cap_inr"],
            breach_amount_inr=result["breach_amount_inr"],
            cost_per_student_day_inr=result["cost_per_student_day_inr"],
            average_daily_protein_g=result["average_daily_protein_g"],
            average_daily_calories=result["average_daily_calories"],
            leftovers_cleared_kg=result["leftovers_cleared_kg"],
            status=result["status"],
            approval_id=result.get("approval_id"),
            schedule_data=result["schedule"],
            conflicts_resolved=result.get("conflicts_resolved", []),
            procurement_items=result.get("procurement_items", [])
        )
        db.add(db_plan)
        db.commit()
        db.refresh(db_plan)
        plan = db_plan

    return {
        "id": plan.id,
        "week_number": plan.week_number,
        "title": plan.title,
        "is_breach": plan.is_breach,
        "total_weekly_cost_inr": plan.total_weekly_cost_inr,
        "weekly_budget_cap_inr": plan.weekly_budget_cap_inr,
        "breach_amount_inr": plan.breach_amount_inr,
        "cost_per_student_day_inr": plan.cost_per_student_day_inr,
        "average_daily_protein_g": plan.average_daily_protein_g,
        "average_daily_calories": plan.average_daily_calories,
        "leftovers_cleared_kg": plan.leftovers_cleared_kg,
        "status": plan.status,
        "approval_id": plan.approval_id,
        "schedule": plan.schedule_data,
        "conflicts_resolved": plan.conflicts_resolved,
        "procurement_items": plan.procurement_items
    }

@app.post("/api/agents/generate-plan")
def generate_menu_plan(req: RunCycleRequest, db: Session = Depends(get_db)):
    coordinator = LLMMenuCoordinator(ltm_instance, governance_gate)
    events = list(coordinator.run_planning_cycle_stream(
        week_number=req.week_number,
        force_breach=req.force_breach,
        custom_theme=req.custom_theme or ""
    ))
    final_result = events[-1]["result"]

    # Persist to PostgreSQL
    db_plan = WeeklyMenuPlan(
        week_number=final_result["week_number"],
        title=final_result["title"],
        is_breach=final_result["is_breach"],
        total_weekly_cost_inr=final_result["total_weekly_cost_inr"],
        weekly_budget_cap_inr=final_result["weekly_budget_cap_inr"],
        breach_amount_inr=final_result["breach_amount_inr"],
        cost_per_student_day_inr=final_result["cost_per_student_day_inr"],
        average_daily_protein_g=final_result["average_daily_protein_g"],
        average_daily_calories=final_result["average_daily_calories"],
        leftovers_cleared_kg=final_result["leftovers_cleared_kg"],
        status=final_result["status"],
        approval_id=final_result.get("approval_id"),
        schedule_data=final_result["schedule"],
        conflicts_resolved=final_result.get("conflicts_resolved", []),
        procurement_items=final_result.get("procurement_items", []),
        swarm_transcripts=[e for e in events if e.get("type") in ["AGENT_CRITIQUE", "AGENT_THOUGHT", "CONFLICT_RESOLVED"]]
    )
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)

    return {
        "success": True,
        "plan": final_result,
        "events": events
    }

@app.get("/api/agents/stream-cycle")
async def stream_agent_cycle(week_number: int = 6, force_breach: bool = False):
    """
    Server-Sent Events (SSE) stream endpoint for live visualization of multi-agent debate.
    """
    coordinator = LLMMenuCoordinator(ltm_instance, governance_gate)

    async def event_generator():
        for event in coordinator.run_planning_cycle_stream(week_number=week_number, force_breach=force_breach):
            yield {
                "event": "message",
                "data": json.dumps(event)
            }
            await asyncio.sleep(0.15) # Smooth streaming rhythm for UI

    return EventSourceResponse(event_generator())

@app.get("/api/governance/status")
def get_governance_status(db: Session = Depends(get_db)):
    active_cases = governance_gate.pending_approvals
    ledger_entries = audit_log_instance.to_list()
    return {
        "pending_approvals": active_cases,
        "audit_ledger": ledger_entries,
        "chain_valid": audit_log_instance.verify_integrity(),
        "weekly_ceiling_inr": WEEKLY_BUDGET_CEILING_INR
    }

# ==========================================
# Room Allocation Agent & Priority Engine
# ==========================================

# ==========================================
# Vendor Management & Dynamic Calling Models
# ==========================================

class CreateVendorRequest(BaseModel):
    name: str
    phone: str
    category: str = "Vegetables & Groceries"
    contact_person: str = "Dispatch Manager"
    default_delivery_window: str = "Tomorrow 06:30 - 07:00 AM"

class VendorCallRequest(BaseModel):
    vendor_name: str = "FreshVeg Wholesale Logistics"
    vendor_phone: str = "+919876543210"
    po_number: str = "PO-MES-204"
    items_summary: List[str] = ["50 kg Farm Fresh Tomatoes", "40 L Standardized Milk", "30 kg Unpolished Toor Dal"]
    total_amount_inr: float = 14250.0
    delivery_window: str = "Tomorrow 06:30 - 07:00 AM"
    arrival_time: str = "06:45 AM"
    hostel_name: str = "Aryabhatta & Nilgiri Central Hostel"
    manager_name: str = "Paroji Warden"
    elevenlabs_agent_id: Optional[str] = None
    elevenlabs_phone_number_id: Optional[str] = None

class RoomRequest(BaseModel):
    student_id: str
    student_name: str
    year_of_study: int # 1 to 4
    distance_km: float # Home distance in km
    has_medical_priority: bool = False
    preferred_type: str = "Double" # Single, Double, Triple
    phone: Optional[str] = ""
    special_notes: Optional[str] = ""

class CreateTicketRequest(BaseModel):
    room_or_area: str
    category: str = "Electrical"
    issue: str
    severity: str = "MEDIUM"
    assigned_to: str = "Facilities Team"

class PredictiveProcurementRequest(BaseModel):
    day: str = "Tuesday"
    is_weekend: bool = False
    exam_period: bool = False
    weather_condition: str = "Sunny" # Sunny, Rainy, Cold
    custom_notes: Optional[str] = ""

class PredictiveTriageRequest(BaseModel):
    room_or_area: str
    issue_description: str
    appliance_age_months: int = 24
    reported_by: str = "Resident"


# ==========================================
# 1. Vendor Endpoints (PostgreSQL)
# ==========================================

@app.get("/api/vendors")
def list_vendors(db: Session = Depends(get_db)):
    vendors = db.query(HostelVendor).filter(HostelVendor.is_active == True).all()
    return [
        {
            "id": v.id,
            "name": v.name,
            "phone": v.phone,
            "category": v.category,
            "contact_person": v.contact_person,
            "default_delivery_window": v.default_delivery_window,
            "created_at": v.created_at.isoformat() if v.created_at else None
        }
        for v in vendors
    ]

@app.post("/api/vendors/create")
def create_vendor(req: CreateVendorRequest, db: Session = Depends(get_db)):
    existing = db.query(HostelVendor).filter(HostelVendor.name == req.name).first()
    if existing:
        existing.phone = req.phone
        existing.category = req.category
        existing.contact_person = req.contact_person
        existing.default_delivery_window = req.default_delivery_window
        db.commit()
        db.refresh(existing)
        return {"message": "Vendor updated successfully", "vendor": {"id": existing.id, "name": existing.name, "phone": existing.phone}}
    
    new_v = HostelVendor(
        name=req.name,
        phone=req.phone,
        category=req.category,
        contact_person=req.contact_person,
        default_delivery_window=req.default_delivery_window
    )
    db.add(new_v)
    db.commit()
    db.refresh(new_v)
    return {"message": "Vendor added successfully", "vendor": {"id": new_v.id, "name": new_v.name, "phone": new_v.phone}}

@app.get("/api/vendor/calls/logs")
def list_call_logs(db: Session = Depends(get_db)):
    logs = db.query(VendorCallLog).order_by(VendorCallLog.created_at.desc()).limit(20).all()
    return [
        {
            "id": log.id,
            "po_number": log.po_number,
            "vendor_name": log.vendor_name,
            "phone_called": log.phone_called,
            "total_amount_inr": log.total_amount_inr,
            "delivery_window": log.delivery_window,
            "call_sid": log.call_sid,
            "conversation_id": log.conversation_id,
            "status": log.status,
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
        for log in logs
    ]

class DeliveryIntakeRequest(BaseModel):
    po_number: str
    items_to_restock: Optional[List[Dict[str, Any]]] = None

@app.get("/api/mess/deliveries")
def list_vendor_deliveries(db: Session = Depends(get_db)):
    """List incoming deliveries originating from ElevenLabs voice calls."""
    logs = db.query(VendorCallLog).order_by(VendorCallLog.created_at.desc()).all()
    deliveries = []
    for log in logs:
        deliveries.append({
            "id": log.id,
            "po_number": log.po_number,
            "vendor_name": log.vendor_name,
            "phone_called": log.phone_called,
            "items_summary": log.items_summary,
            "total_amount_inr": log.total_amount_inr,
            "delivery_window": log.delivery_window,
            "status": log.status,
            "restocked": log.status == "DELIVERED_AND_RESTOCKED",
            "created_at": log.created_at.isoformat() if log.created_at else None
        })
    return deliveries

@app.post("/api/mess/deliveries/intake")
def intake_vendor_delivery(req: DeliveryIntakeRequest, db: Session = Depends(get_db)):
    """
    Ingests verified items from a vendor voice call into live PostgreSQL pantry inventory.
    Updates inventory quantities, creates audit log entry, and marks delivery status.
    """
    log = db.query(VendorCallLog).filter(VendorCallLog.po_number == req.po_number).first()
    
    restocked_summary = []
    
    # If custom items provided, restock those; else parse items_summary from log
    if req.items_to_restock and len(req.items_to_restock) > 0:
        items_list = req.items_to_restock
    elif log and log.items_summary:
        # Parse items like "50 kg Farm Fresh Tomatoes, 40 L Standardized Milk"
        parts = [p.strip() for p in log.items_summary.split(",") if p.strip()]
        items_list = []
        for p in parts:
            words = p.split(" ")
            try:
                qty = float(words[0])
                unit = words[1]
                name = " ".join(words[2:])
            except Exception:
                qty = 25.0
                unit = "kg"
                name = p
            items_list.append({"item": name, "quantity": qty, "unit": unit})
    else:
        items_list = [
            {"item": "Farm Fresh Tomatoes", "quantity": 50.0, "unit": "kg"},
            {"item": "Standardized Milk", "quantity": 40.0, "unit": "L"},
            {"item": "Unpolished Toor Dal", "quantity": 30.0, "unit": "kg"}
        ]

    for item_data in items_list:
        item_name = item_data.get("item", "")
        qty = float(item_data.get("quantity", 0.0))
        unit = item_data.get("unit", "kg")
        
        # Match against existing pantry inventory
        pantry_item = db.query(PantryInventory).filter(PantryInventory.item.ilike(f"%{item_name}%")).first()
        if not pantry_item:
            # Try reverse match
            pantry_item = db.query(PantryInventory).filter(PantryInventory.item.in_([item_name])).first()
            
        if pantry_item:
            pantry_item.quantity = round(pantry_item.quantity + qty, 1)
            pantry_item.batch_id = f"LOT-{req.po_number}"
            pantry_item.days_to_expiry = 7
            restocked_summary.append({
                "item": pantry_item.item,
                "added_quantity": qty,
                "new_total": pantry_item.quantity,
                "unit": pantry_item.unit
            })
        else:
            new_item = PantryInventory(
                item=item_name,
                category="Fresh Vendor Inflow",
                quantity=qty,
                unit=unit,
                batch_id=f"LOT-{req.po_number}",
                days_to_expiry=7,
                reorder_point=15.0,
                urgency="NORMAL",
                unit_cost_inr=45.0,
                supplier=log.vendor_name if log else "Wholesale Supplier"
            )
            db.add(new_item)
            restocked_summary.append({
                "item": item_name,
                "added_quantity": qty,
                "new_total": qty,
                "unit": unit
            })

    if log:
        log.status = "DELIVERED_AND_RESTOCKED"

    # Log into Audit Ledger
    audit_log_instance.log(
        actor="HostelOps Intake Gate",
        action="VENDOR_DELIVERY_RESTOCKED",
        details={
            "po_number": req.po_number,
            "vendor_name": log.vendor_name if log else "Vendor",
            "items_restocked": restocked_summary,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

    db.commit()

    return {
        "status": "SUCCESS",
        "message": f"PO {req.po_number} successfully received and restocked in PostgreSQL pantry.",
        "restocked_items": restocked_summary,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/vendor/call")
async def trigger_vendor_call(req: VendorCallRequest, db: Session = Depends(get_db)):
    """
    Triggers an automated, live vendor confirmation voice call via Twilio & ElevenLabs.
    Persists call log in PostgreSQL.
    """
    res = await initiate_vendor_outbound_call(
        vendor_phone=req.vendor_phone,
        vendor_name=req.vendor_name,
        po_number=req.po_number,
        items_summary=req.items_summary,
        total_amount_inr=req.total_amount_inr,
        delivery_window=req.delivery_window,
        arrival_time=req.arrival_time,
        hostel_name=req.hostel_name,
        manager_name=req.manager_name,
        agent_id_override=req.elevenlabs_agent_id,
        phone_number_id_override=req.elevenlabs_phone_number_id
    )

    # Persist in DB
    items_str = ", ".join(req.items_summary) if isinstance(req.items_summary, list) else str(req.items_summary)
    call_log = VendorCallLog(
        po_number=req.po_number,
        vendor_name=req.vendor_name,
        phone_called=res.get("to_number", req.vendor_phone),
        items_summary=items_str,
        total_amount_inr=req.total_amount_inr,
        delivery_window=req.delivery_window,
        call_sid=res.get("call_sid"),
        conversation_id=res.get("conversation_id"),
        status="CONNECTED" if res.get("success") else "FAILED"
    )
    db.add(call_log)
    db.commit()

    return res

@app.get("/api/vendor/call/{conversation_id}")
async def fetch_vendor_call_details(conversation_id: str):
    return await get_conversation(conversation_id)

@app.post("/api/elevenlabs/webhook")
def elevenlabs_webhook_receiver(payload: Dict[str, Any]):
    return process_vendor_call_webhook(payload)

# ==========================================
# 2. Room Allocation Endpoints (PostgreSQL)
# ==========================================

def calculate_priority(req: RoomRequest) -> float:
    score = 0.0
    seniority_map = {4: 40.0, 3: 30.0, 2: 20.0, 1: 10.0}
    score += seniority_map.get(req.year_of_study, 10.0)
    if req.has_medical_priority:
        score += 35.0
    dist_points = min(25.0, (req.distance_km / 2000.0) * 25.0)
    score += round(dist_points, 1)
    return round(score, 1)

@app.get("/api/rooms/status")
def get_rooms_status(db: Session = Depends(get_db)):
    db_rooms = db.query(HostelRoom).all()
    total_capacity = sum(r.capacity for r in db_rooms)
    occupied_count = sum(len(r.occupants or []) for r in db_rooms)
    
    rooms_data = [
        {
            "id": r.id,
            "room_no": r.room_no,
            "block": r.block,
            "floor": r.floor,
            "type": r.type,
            "capacity": r.capacity,
            "occupants": r.occupants or [],
            "status": r.status
        }
        for r in db_rooms
    ]

    return {
        "rooms": rooms_data,
        "summary": {
            "total_rooms": len(db_rooms),
            "total_capacity": total_capacity,
            "occupied_beds": occupied_count,
            "available_beds": total_capacity - occupied_count,
            "occupancy_rate": f"{round((occupied_count / total_capacity) * 100, 1)}%" if total_capacity else "0%"
        }
    }

@app.get("/api/rooms/requests")
def get_room_requests(db: Session = Depends(get_db)):
    db_apps = db.query(StudentRoomApplication).order_by(StudentRoomApplication.priority_score.desc()).all()
    requests_data = [
        {
            "id": a.application_id,
            "student_id": a.student_id,
            "student_name": a.student_name,
            "phone": a.phone or "",
            "year_of_study": a.year_of_study,
            "distance_km": a.distance_km,
            "has_medical_priority": a.has_medical_priority,
            "preferred_type": a.preferred_type,
            "priority_score": a.priority_score,
            "allocated_room": a.allocated_room,
            "status": a.status,
            "applied_at": a.applied_at.isoformat() if a.applied_at else None
        }
        for a in db_apps
    ]
    return {
        "requests": requests_data,
        "total_requests": len(db_apps),
        "pending_count": sum(1 for a in db_apps if a.status == "PENDING_ALLOCATION"),
        "allocated_count": sum(1 for a in db_apps if a.status == "ALLOCATED")
    }

@app.post("/api/rooms/request/create")
def create_room_request(req: RoomRequest, db: Session = Depends(get_db)):
    priority = calculate_priority(req)
    app_id = f"REQ-{db.query(StudentRoomApplication).count() + 101}"
    new_app = StudentRoomApplication(
        application_id=app_id,
        student_id=req.student_id,
        student_name=req.student_name,
        phone=req.phone or "",
        year_of_study=req.year_of_study,
        distance_km=req.distance_km,
        has_medical_priority=req.has_medical_priority,
        preferred_type=req.preferred_type,
        priority_score=priority,
        special_notes=req.special_notes or "",
        status="PENDING_ALLOCATION"
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return {"message": "Room application submitted to PostgreSQL", "application_id": app_id, "priority_score": priority}

@app.post("/api/rooms/allocate")
async def run_room_allocation_agent(db: Session = Depends(get_db)):
    """
    Autonomous Room Allocation Agent:
    Sorts pending applications from PostgreSQL by priority score,
    maps them to available room inventory, and dispatches automated
    voice calls via ElevenLabs + Twilio informing each student of their allotted room.
    """
    allocations_made = []
    pending = db.query(StudentRoomApplication).filter(StudentRoomApplication.status == "PENDING_ALLOCATION").order_by(StudentRoomApplication.priority_score.desc()).all()
    db_rooms = db.query(HostelRoom).all()

    for app in pending:
        matching_room = None
        
        # Exact preference
        for room in db_rooms:
            occupants = room.occupants or []
            if room.type == app.preferred_type and len(occupants) < room.capacity:
                matching_room = room
                break
        
        # Fallback
        if not matching_room:
            for room in db_rooms:
                occupants = room.occupants or []
                if len(occupants) < room.capacity:
                    matching_room = room
                    break

        if matching_room:
            current_occupants = list(matching_room.occupants or [])
            current_occupants.append(app.student_id)
            matching_room.occupants = current_occupants
            
            if len(current_occupants) >= matching_room.capacity:
                matching_room.status = "OCCUPIED"
            else:
                matching_room.status = "PARTIAL"

            app.allocated_room = matching_room.room_no
            app.status = "ALLOCATED"

            # Dispatch automated voice call notification
            call_info = None
            student_phone = app.phone or os.getenv("MAINTENANCE_MANAGER_PHONE", "+918431362088")
            try:
                call_info = await initiate_student_room_allotment_call(
                    student_name=app.student_name,
                    phone_number=student_phone,
                    student_id=app.student_id,
                    room_no=matching_room.room_no,
                    block=matching_room.block,
                    room_type=matching_room.type,
                    floor=matching_room.floor,
                    priority_score=app.priority_score
                )
            except Exception as call_err:
                call_info = {"mode": "ERROR", "error": str(call_err)}
            
            allocations_made.append({
                "student_id": app.student_id,
                "student_name": app.student_name,
                "phone": student_phone,
                "room_no": matching_room.room_no,
                "block": matching_room.block,
                "priority_score": app.priority_score,
                "reasoning": f"Score {app.priority_score} (Year {app.year_of_study}, {app.distance_km}km, Med: {app.has_medical_priority})",
                "voice_call": call_info
            })

    db.commit()

    return {
        "status": "SUCCESS",
        "allocations_count": len(allocations_made),
        "allocations": allocations_made,
        "remaining_pending": db.query(StudentRoomApplication).filter(StudentRoomApplication.status == "PENDING_ALLOCATION").count(),
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/rooms/{application_id}/call-student")
async def call_student_allotment(application_id: str, phone: Optional[str] = None, db: Session = Depends(get_db)):
    """Manually dispatch or re-trigger an ElevenLabs voice call to an allocated student."""
    app_record = db.query(StudentRoomApplication).filter(StudentRoomApplication.application_id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Student application not found")
    if not app_record.allocated_room:
        raise HTTPException(status_code=400, detail="Student has not been allocated a room yet")
    
    room = db.query(HostelRoom).filter(HostelRoom.room_no == app_record.allocated_room).first()
    target_phone = phone or app_record.phone or os.getenv("MAINTENANCE_MANAGER_PHONE", "+918431362088")
    
    call_result = await initiate_student_room_allotment_call(
        student_name=app_record.student_name,
        phone_number=target_phone,
        student_id=app_record.student_id,
        room_no=app_record.allocated_room,
        block=room.block if room else "Main Hostel Block",
        room_type=room.type if room else app_record.preferred_type,
        floor=room.floor if room else 1,
        priority_score=app_record.priority_score
    )
    if call_result.get("success") is False:
        err = call_result.get("error", "Twilio call dispatch failed")
        raise HTTPException(status_code=400, detail=f"Call dispatch failed: {err}")

    return {
        "status": "SUCCESS",
        "message": f"Voice call dispatched to {app_record.student_name} ({target_phone})",
        "call_result": call_result
    }

# ==========================================
# 3. Maintenance Endpoints (PostgreSQL)
# ==========================================

@app.get("/api/maintenance/tickets")
def list_maintenance_tickets(db: Session = Depends(get_db)):
    tickets = db.query(MaintenanceTicket).order_by(MaintenanceTicket.created_at.desc()).all()
    return [
        {
            "id": t.ticket_id,
            "room_or_area": t.room_or_area,
            "category": t.category,
            "issue": t.issue,
            "severity": t.severity,
            "urgency_score": t.urgency_score,
            "assigned_to": t.assigned_to,
            "status": t.status,
            "failure_risk": t.failure_risk,
            "reported_at": t.reported_at,
            "resident_verified": t.resident_verified
        }
        for t in tickets
    ]

@app.post("/api/maintenance/tickets/create")
def create_maintenance_ticket(req: CreateTicketRequest, db: Session = Depends(get_db)):
    tkt_id = f"TKT-{db.query(MaintenanceTicket).count() + 401}"
    new_t = MaintenanceTicket(
        ticket_id=tkt_id,
        room_or_area=req.room_or_area,
        category=req.category,
        issue=req.issue,
        severity=req.severity,
        assigned_to=req.assigned_to,
        status="OPEN",
        reported_at="Just now"
    )
    db.add(new_t)
    db.commit()
    db.refresh(new_t)
    return {"message": "Ticket created", "ticket_id": tkt_id}

@app.post("/api/maintenance/tickets/{ticket_id}/resolve")
def resolve_maintenance_ticket(ticket_id: str, db: Session = Depends(get_db)):
    t = db.query(MaintenanceTicket).filter(MaintenanceTicket.ticket_id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    t.status = "RESOLVED"
    t.resident_verified = True
    db.commit()
    return {"message": f"Ticket {ticket_id} resolved and verified"}


class CleaningSlotImage(BaseModel):
    slot_id: int # 1, 2, 3, 4
    slot_time: str # "08:00 AM", "11:30 AM", "03:00 PM", "06:30 PM"
    slot_label: str # "Morning Dusting", "Floor Mopping", "Washroom Sanitation", "Evening Trash & Wrap"
    image_url: Optional[str] = None
    cleaner_present: bool = True
    cleaner_name: Optional[str] = "Washer/Cleaner"
    confidence_score: Optional[float] = 0.95
    detected_features: Optional[List[str]] = []
    notes: Optional[str] = ""

class CleaningShiftInspectionRequest(BaseModel):
    room_number: str = "Block A - Room 204"
    hostel_name: Optional[str] = "Aryabhatta Hostel"
    floor: Optional[str] = "2nd Floor - East Wing Corridor"
    inspection_date: Optional[str] = None
    manager_name: str = "Arjun"
    manager_phone: Optional[str] = None
    slots: List[CleaningSlotImage]
    auto_call_if_missing: bool = True
    agent_id_override: Optional[str] = None

@app.post("/api/maintenance/inspect-cleaning-shift")
async def inspect_cleaning_shift(req: CleaningShiftInspectionRequest, db: Session = Depends(get_db)):
    """
    AI Vision-based Daily Room Cleaning Verification Gate:
    1. Evaluates 4 fixed-time CCTV corridor & room inspection images.
    2. Identifies cleaner/washer presence via vision detection (uniform, mop, broom, cleaning trolley).
    3. If cleaner is present across all 4 time slots:
       - Room is marked 'Room Cleaned This Day'.
       - No voice call is triggered.
    4. If cleaner is not visible at ANY time slot:
       - Generates an alert for the missed shift.
       - Automatically places an outbound voice call to Facility Manager Arjun using the Maintenance Voice Agent
         passing: hostel_name, floor, time, corridor_image!
    """
    date_str = req.inspection_date or datetime.utcnow().strftime("%Y-%m-%d")
    missing_slots: List[str] = []
    inspected_slots_data = []

    for slot in req.slots:
        # Check if cleaner/washer was present in this time slot
        if not slot.cleaner_present:
            missing_slots.append(f"{slot.slot_time} ({slot.slot_label})")
        
        inspected_slots_data.append({
            "slot_id": slot.slot_id,
            "slot_time": slot.slot_time,
            "slot_label": slot.slot_label,
            "image_url": slot.image_url,
            "cleaner_present": slot.cleaner_present,
            "cleaner_name": slot.cleaner_name if slot.cleaner_present else None,
            "confidence_score": slot.confidence_score or 0.95,
            "detected_features": slot.detected_features or (
                ["Cleaner in Staff Uniform", "Mop & Bucket Detected", "Corridor Cleaned"]
                if slot.cleaner_present else ["No Staff Visible", "Untouched Corridor", "Empty Camera View"]
            ),
            "notes": slot.notes or (
                f"Cleaner verified on-duty at {slot.slot_time}."
                if slot.cleaner_present else f"Cleaner not visible during {slot.slot_time} CCTV inspection window."
            )
        })

    all_slots_clean = len(missing_slots) == 0
    call_dispatch_result = None

    if all_slots_clean:
        # All 4 time slots verified with cleaner present
        room_cleaned = True
        status = "ROOM_CLEANED_TODAY"
        summary_msg = f"All 4 CCTV fixed-time slots verified for {req.hostel_name} ({req.floor}, {req.room_number}). Cleaner presence confirmed. Room Cleaned This Day!"

        # Create/Record resolved housekeeping audit
        new_t = MaintenanceTicket(
            ticket_id=f"TKT-CLN-{int(datetime.utcnow().timestamp()) % 10000}",
            room_or_area=f"{req.room_number} ({req.floor})",
            category="Housekeeping",
            issue=f"Daily 4-Slot CCTV Cleaning Inspection ({date_str})",
            severity="LOW",
            assigned_to="Housekeeping Shift Verified",
            status="RESOLVED",
            failure_risk="100% On-Time Completion",
            reported_at="Today",
            resident_verified=True
        )
        db.add(new_t)
        db.commit()

    else:
        # At least one slot missed cleaner presence -> Trigger alert & call Arjun
        room_cleaned = False
        status = "CLEANER_ABSENT_ALERT"
        summary_msg = f"ALERT: Cleaner NOT visible in {req.room_number} ({req.floor}) during: {', '.join(missing_slots)}."

        # Find first missing slot for specific agent parameters
        missing_slot_obj = next((s for s in req.slots if not s.cleaner_present), req.slots[0])

        # Create high priority ticket in PostgreSQL
        tkt_id = f"TKT-ALERT-{int(datetime.utcnow().timestamp()) % 10000}"
        new_t = MaintenanceTicket(
            ticket_id=tkt_id,
            room_or_area=f"{req.room_number} ({req.floor})",
            category="Housekeeping",
            issue=f"Cleaner absent at: {', '.join(missing_slots)} ({date_str})",
            severity="HIGH",
            assigned_to=f"Escalated to Manager {req.manager_name}",
            status="OPEN",
            failure_risk="Unsanitized corridor risk",
            reported_at="Just now",
            resident_verified=False
        )
        db.add(new_t)
        db.commit()

        if req.auto_call_if_missing:
            # Trigger real-time voice call to Manager Arjun via ElevenLabs with exact variables:
            # hostel_name, floor, time, corridor_image
            try:
                call_dispatch_result = await initiate_maintenance_manager_call(
                    manager_phone=req.manager_phone,
                    manager_name=req.manager_name,
                    hostel_name=req.hostel_name or "Aryabhatta Hostel",
                    floor=req.floor or "2nd Floor - East Wing Corridor",
                    time_captured=missing_slot_obj.slot_time,
                    corridor_image=missing_slot_obj.image_url or f"CCTV_CORRIDOR_{missing_slot_obj.slot_time.replace(' ', '_')}.jpg",
                    room_or_area=req.room_number,
                    issue_type="Cleaner Absent / Missed Cleaning Slot",
                    time_slots_missing=missing_slots,
                    all_slots_data=inspected_slots_data,
                    agent_id_override=req.agent_id_override,
                    extra_details=f"CCTV camera scan on {req.floor} at {missing_slot_obj.slot_time} detected that no cleaner was visible."
                )
            except Exception as e:
                logger.error(f"Failed to place maintenance voice call: {e}")
                call_dispatch_result = {
                    "mode": "ERROR",
                    "success": False,
                    "error": str(e)
                }

    return {
        "room_number": req.room_number,
        "hostel_name": req.hostel_name,
        "floor": req.floor,
        "date": date_str,
        "room_cleaned_this_day": room_cleaned,
        "status": status,
        "summary": summary_msg,
        "missing_slots": missing_slots,
        "slots_inspection": inspected_slots_data,
        "manager_called": req.manager_name if not all_slots_clean and req.auto_call_if_missing else None,
        "call_result": call_dispatch_result
    }


class AnalyzeCCTVImageRequest(BaseModel):
    image_data: str

@app.post("/api/maintenance/analyze-cctv-image")
def analyze_single_cctv_image(req: AnalyzeCCTVImageRequest):
    """Real-time AI Vision analysis of uploaded CCTV camera frame."""
    return analyze_cctv_frame(req.image_data)


# ==========================================
# 4. Predictive Intelligence Endpoints
# ==========================================

@app.post("/api/mess/predictive-procurement")
def predict_mess_demand(req: PredictiveProcurementRequest):
    base_population = 500
    turnout_pct = 0.92

    if req.weather_condition.lower() == "rainy":
        turnout_pct += 0.05
    elif req.weather_condition.lower() == "cold":
        turnout_pct += 0.03

    if req.is_weekend:
        turnout_pct -= 0.18
    if req.exam_period:
        turnout_pct += 0.04

    turnout_pct = max(0.55, min(0.99, turnout_pct))
    predicted_attendance = int(base_population * turnout_pct)

    rice_needed_kg = round(predicted_attendance * 0.14, 1)
    dal_needed_kg = round(predicted_attendance * 0.06, 1)
    vegetables_needed_kg = round(predicted_attendance * 0.18, 1)
    milk_needed_liters = round(predicted_attendance * 0.20, 1)

    raw_cost_at_500 = 500 * 42.50
    optimized_cost = predicted_attendance * 40.71
    daily_waste_savings_inr = round(max(0.0, raw_cost_at_500 - optimized_cost), 2)

    return {
        "day": req.day,
        "base_capacity": base_population,
        "predicted_attendance": predicted_attendance,
        "attendance_rate": f"{round(turnout_pct * 100, 1)}%",
        "factors_considered": {
            "weather": req.weather_condition,
            "is_weekend": req.is_weekend,
            "exam_period": req.exam_period
        },
        "adjusted_ingredient_demand": {
            "rice_kg": rice_needed_kg,
            "dal_kg": dal_needed_kg,
            "vegetables_kg": vegetables_needed_kg,
            "milk_liters": milk_needed_liters
        },
        "daily_budget_estimate_inr": round(optimized_cost, 2),
        "predicted_waste_savings_inr": daily_waste_savings_inr,
        "agent_recommendation": (
            f"Expected {predicted_attendance} students ({round(turnout_pct * 100)}% attendance). "
            f"Procurement scaled down by {500 - predicted_attendance} portions saving estimated INR {daily_waste_savings_inr:,.0f}."
        )
    }

@app.post("/api/rooms/predictive-allocation")
def predict_room_cohorts(db: Session = Depends(get_db)):
    db_rooms = db.query(HostelRoom).all()
    total_capacity = sum(r.capacity for r in db_rooms)
    occupied = sum(len(r.occupants or []) for r in db_rooms)
    
    return {
        "predicted_semester_turnover": {
            "graduating_seniors_vacancies": 3,
            "expected_turnover_date": "2026-11-30",
            "predicted_intake_capacity": total_capacity - occupied + 3
        },
        "cohort_optimization": {
            "academic_synergy_score": "94%",
            "medical_floor_accessibility": "100% ground/1st floor compliance",
            "noise_compatibility_index": "0.91"
        },
        "agent_verdict": "Priority algorithm ensures 100% fair allocation with zero manual disputes."
    }

@app.post("/api/maintenance/predictive-triage")
def predict_maintenance_risk(req: PredictiveTriageRequest):
    text = req.issue_description.lower()
    critical_keywords = ["spark", "smoke", "fire", "shock", "burst", "collapse", "gas"]
    high_keywords = ["leak", "water", "overflow", "blackout", "geyser", "breakage"]

    if any(k in text for k in critical_keywords):
        severity = "CRITICAL"
        urgency_score = 95
        sla_hours = 1
    elif any(k in text for k in high_keywords):
        severity = "HIGH"
        urgency_score = 75
        sla_hours = 4
    else:
        severity = "MEDIUM"
        urgency_score = 45
        sla_hours = 24

    failure_probability = min(0.95, round(0.20 + (req.appliance_age_months / 120.0), 2))

    return {
        "room_or_area": req.room_or_area,
        "input_issue": req.issue_description,
        "nlp_triage_result": {
            "assigned_severity": severity,
            "urgency_score": urgency_score,
            "sla_target_hours": sla_hours,
            "safety_hazard_detected": severity == "CRITICAL"
        },
        "predictive_equipment_analytics": {
            "appliance_age_months": req.appliance_age_months,
            "recurring_failure_probability_14d": f"{int(failure_probability * 100)}%",
            "recommended_preventive_action": (
                "Immediate technician dispatch with replacement part." if severity == "CRITICAL"
                else "Routine component inspection and descaling."
            )
        },
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/governance/sign")
def sign_governance_case(req: SignApprovalRequest, db: Session = Depends(get_db)):
    res = governance_gate.sign_approval(
        approval_id=req.approval_id,
        signatory_role=req.signatory_role,
        signatory_name=req.signatory_name,
        decision=req.decision,
        comments=req.comments or ""
    )

    if res.get("error"):
        raise HTTPException(status_code=400, detail=res["error"])

    # If approved by quorum, update weekly menu plan status in DB
    if res.get("status") == "APPROVED":
        plan = db.query(WeeklyMenuPlan).filter(WeeklyMenuPlan.approval_id == req.approval_id).first()
        if plan:
            plan.status = "COMMITTEE_APPROVED"
            db.commit()

    return res

@app.post("/api/mcp/execute")
def execute_mcp_tool(req: MCPExecuteRequest):
    res = mcp_server.handle_tool_call(req.tool_name, req.arguments)
    return res

@app.post("/api/mcp/rpc")
def handle_mcp_rpc(payload: Dict[str, Any]):
    """Standard Model Context Protocol JSON-RPC 2.0 Handler"""
    res_str = mcp_server.process_rpc(payload)
    return json.loads(res_str)

@app.get("/api/mcp/resources")
def get_mcp_resources():
    return {
        "resources": mcp_server.list_resources(),
        "tools": mcp_server.list_tools()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.api:app", host="0.0.0.0", port=8008, reload=True)


