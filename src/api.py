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
    PantryInventory, VendorPrice, WeeklyMenuPlan, AuditLedgerEntry
)
from src.governance import GovernanceGate, AuditLog, WEEKLY_BUDGET_CEILING_INR
from src.memory import LongTermMemory
from src.llm_swarm import LLMMenuCoordinator
from mcp.server import MessMCPServer

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
