"""
Governance, Budget Ceiling Gate, and Cryptographic Audit Log
Hostel Mess Operations Agent
"""

import hashlib
import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional

WEEKLY_BUDGET_CEILING_INR = 577500.00  # 500 students * 165 INR/day * 7 days
MONTHLY_BUDGET_CEILING_INR = 2475000.00 # 500 students * 165 INR/day * 30 days

class AuditEntry:
    def __init__(self, index: int, previous_hash: str, actor: str, action: str, details: Dict[str, Any]):
        self.index = index
        self.timestamp = datetime.utcnow().isoformat() + "Z"
        self.actor = actor
        self.action = action
        self.details = details
        self.previous_hash = previous_hash
        self.hash = self.compute_hash()

    def compute_hash(self) -> str:
        payload = f"{self.index}|{self.timestamp}|{self.actor}|{self.action}|{json.dumps(self.details, sort_keys=True)}|{self.previous_hash}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "actor": self.actor,
            "action": self.action,
            "details": self.details,
            "previous_hash": self.previous_hash,
            "hash": self.hash
        }

class AuditLog:
    def __init__(self):
        self.chain: List[AuditEntry] = []
        # Genesis block
        genesis = AuditEntry(0, "0"*64, "SYSTEM_INIT", "GENESIS_AUDIT_BLOCK", {"message": "Hostel Mess Audit Trail Initialized", "semester": "Fall 2026"})
        self.chain.append(genesis)

    def log(self, actor: str, action: str, details: Dict[str, Any]) -> AuditEntry:
        prev_hash = self.chain[-1].hash
        entry = AuditEntry(len(self.chain), prev_hash, actor, action, details)
        self.chain.append(entry)
        return entry

    def verify_integrity(self) -> bool:
        for i in range(1, len(self.chain)):
            curr = self.chain[i]
            prev = self.chain[i - 1]
            if curr.previous_hash != prev.hash:
                return False
            if curr.hash != curr.compute_hash():
                return False
        return True

    def to_list(self) -> List[Dict[str, Any]]:
        return [entry.to_dict() for entry in self.chain]

class GovernanceGate:
    def __init__(self, audit_log: AuditLog):
        self.audit_log = audit_log
        self.pending_approvals: Dict[str, Dict[str, Any]] = {}

    def evaluate_order(self, week_number: int, total_requisition_inr: float, line_items: List[Dict[str, Any]], justification: str = "") -> Dict[str, Any]:
        """
        Check if order exceeds weekly ceiling of ₹5,77,500.
        If under ceiling: auto-approves.
        If over ceiling: pauses and initiates approval gate.
        """
        is_breach = total_requisition_inr > WEEKLY_BUDGET_CEILING_INR
        breach_amount = round(total_requisition_inr - WEEKLY_BUDGET_CEILING_INR, 2) if is_breach else 0.0

        if not is_breach:
            self.audit_log.log(
                actor="GovernanceGate",
                action="AUTO_APPROVED_WITHIN_BUDGET",
                details={
                    "week_number": week_number,
                    "requisition_inr": total_requisition_inr,
                    "ceiling_inr": WEEKLY_BUDGET_CEILING_INR,
                    "item_count": len(line_items)
                }
            )
            return {
                "status": "APPROVED",
                "is_breach": False,
                "requisition_inr": total_requisition_inr,
                "ceiling_inr": WEEKLY_BUDGET_CEILING_INR,
                "breach_amount_inr": 0.0,
                "message": f"Requisition of ₹{total_requisition_inr:,.2f} is within weekly ceiling of ₹{WEEKLY_BUDGET_CEILING_INR:,.2f}. Auto-approved."
            }

        # Budget Breach: requires mess committee approval
        approval_id = f"GATE-BREACH-WK{week_number}-{int(time.time())}"
        approval_record = {
            "approval_id": approval_id,
            "week_number": week_number,
            "status": "PENDING_COMMITTEE_APPROVAL",
            "total_requisition_inr": total_requisition_inr,
            "ceiling_inr": WEEKLY_BUDGET_CEILING_INR,
            "breach_amount_inr": breach_amount,
            "breach_percentage": round((breach_amount / WEEKLY_BUDGET_CEILING_INR) * 100, 2),
            "justification": justification or "Special Festival / Cultural Week Menu with premium items",
            "required_signatories": ["Mess Warden", "Student General Secretary (Mess)", "Mess Manager"],
            "signatures_recorded": {},
            "line_items": line_items,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        self.pending_approvals[approval_id] = approval_record

        self.audit_log.log(
            actor="GovernanceGate",
            action="BUDGET_BREACH_DETECTED",
            details={
                "approval_id": approval_id,
                "week_number": week_number,
                "requisition_inr": total_requisition_inr,
                "ceiling_inr": WEEKLY_BUDGET_CEILING_INR,
                "breach_inr": breach_amount,
                "reason": justification
            }
        )

        return approval_record

    def sign_approval(self, approval_id: str, signatory_role: str, signatory_name: str, decision: str, comments: str = "") -> Dict[str, Any]:
        """
        Record a committee member's vote/signature.
        """
        record = self.pending_approvals.get(approval_id)
        if not record:
            return {"error": f"No approval record found for ID: {approval_id}"}

        record["signatures_recorded"][signatory_role] = {
            "name": signatory_name,
            "decision": decision, # 'APPROVE' or 'REJECT'
            "comments": comments,
            "signed_at": datetime.utcnow().isoformat() + "Z"
        }

        self.audit_log.log(
            actor=f"{signatory_role}:{signatory_name}",
            action=f"COMMITTEE_SIGNATURE_{decision.upper()}",
            details={
                "approval_id": approval_id,
                "decision": decision,
                "comments": comments
            }
        )

        # Check if all required signatures are present
        all_required = set(record["required_signatories"])
        recorded_roles = set(record["signatures_recorded"].keys())

        if all_required.issubset(recorded_roles):
            # Evaluate unanimous or majority approval
            approvals = sum(1 for s in record["signatures_recorded"].values() if s["decision"] == "APPROVE")
            if approvals >= 2: # 2 out of 3 quorum approval
                record["status"] = "COMMITTEE_APPROVED"
                self.audit_log.log(
                    actor="GovernanceGate",
                    action="BUDGET_BREACH_COMMITTEE_RATIFIED",
                    details={
                        "approval_id": approval_id,
                        "approved_amount_inr": record["total_requisition_inr"],
                        "signatories": list(record["signatures_recorded"].keys())
                    }
                )
            else:
                record["status"] = "COMMITTEE_REJECTED"
                self.audit_log.log(
                    actor="GovernanceGate",
                    action="BUDGET_BREACH_REJECTED",
                    details={"approval_id": approval_id}
                )

        return record
