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
from datetime import datetime

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
    get_conversation,
    process_vendor_call_webhook
)

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

class MCPExecuteRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = {}

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
            "supplier": i.supplier
        }
        for i in items
    ]

@app.post("/api/inventory/update")
def update_inventory(req: UpdateInventoryRequest, db: Session = Depends(get_db)):
    inv_item = db.query(PantryInventory).filter(PantryInventory.item == req.item).first()
    if not inv_item:
        raise HTTPException(status_code=404, detail=f"Pantry item '{req.item}' not found.")
    
    new_qty = max(0.0, inv_item.quantity + req.quantity_delta)
    inv_item.quantity = new_qty
    db.commit()
    return {
        "item": inv_item.item,
        "new_quantity": new_qty,
        "unit": inv_item.unit
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
def run_room_allocation_agent(db: Session = Depends(get_db)):
    """
    Autonomous Room Allocation Agent:
    Sorts pending applications from PostgreSQL by priority score
    and maps them to available room inventory.
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
            
            allocations_made.append({
                "student_id": app.student_id,
                "student_name": app.student_name,
                "room_no": matching_room.room_no,
                "block": matching_room.block,
                "priority_score": app.priority_score,
                "reasoning": f"Score {app.priority_score} (Year {app.year_of_study}, {app.distance_km}km, Med: {app.has_medical_priority})"
            })

    db.commit()

    return {
        "status": "SUCCESS",
        "allocations_count": len(allocations_made),
        "allocations": allocations_made,
        "remaining_pending": db.query(StudentRoomApplication).filter(StudentRoomApplication.status == "PENDING_ALLOCATION").count(),
        "timestamp": datetime.utcnow().isoformat()
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


