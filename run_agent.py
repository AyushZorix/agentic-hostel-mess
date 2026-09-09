"""
End-to-End Standing Operations Runner
Runs weekly cycles, writes audit log, records execution trace, and executes the approval gate.
"""

import json
import os
from src.governance import AuditLog, GovernanceGate
from src.memory import LongTermMemory
from src.swarm import MenuCoordinator

def run_semester_cycle():
    audit_log = AuditLog()
    gov = GovernanceGate(audit_log)
    ltm = LongTermMemory()
    coordinator = MenuCoordinator(ltm, gov)

    print("=" * 70)
    print("HOSTEL MESS STANDING OPERATIONS AGENT - SEMESTER CYCLE EXECUTION")
    print("=" * 70)

    # 1. Run Standard Week 6 Cycle
    print("\n>>> Executing Week 6 Routine Planning Cycle...")
    week6_plan = coordinator.generate_weekly_plan(week_number=6, force_breach=False)
    print(f"Week 6 Plan Generated. Total Estimated Cost: INR {week6_plan['total_weekly_cost_inr']:,.2f}")
    print(f"Daily Cost Per Student: INR {week6_plan['total_weekly_cost_inr'] / (500 * 7):.2f}")
    print(f"Governance Decision: {week6_plan['governance_evaluation']['status']}")
    print(f"Conflicts Handled: {len(week6_plan['conflicts_resolved'])}")
    for conf in week6_plan["conflicts_resolved"]:
        print(f"  - [{conf['conflict_id']}] {conf['description']}")
        print(f"    Resolution: {conf['resolution']}")

    # 2. Run Festive Week 8 (Budget Breach Case)
    print("\n>>> Executing Week 8 Festive Banquet Planning Cycle (Simulating Budget Spike)...")
    week8_plan = coordinator.generate_weekly_plan(week_number=8, force_breach=True)
    gov_eval = week8_plan["governance_evaluation"]
    print(f"Week 8 Plan Generated. Total Estimated Cost: INR {week8_plan['total_weekly_cost_inr']:,.2f}")
    print(f"Weekly Budget Ceiling: INR {week8_plan['weekly_budget_cap_inr']:,.2f}")
    print(f"Breach Amount: INR {gov_eval.get('breach_amount_inr', 0):,.2f} (+{gov_eval.get('breach_percentage', 0)}%)")
    print(f"Status: {gov_eval['status']}")

    # 3. Handle Approval Gate for the Breach Case
    approval_id = gov_eval["approval_id"]
    print(f"\n>>> Triggering Mess Committee Human-in-the-Loop Approval Gate for: {approval_id}")

    # Signatory 1: Student General Secretary
    sig1 = gov.sign_approval(
        approval_id=approval_id,
        signatory_role="Student General Secretary (Mess)",
        signatory_name="Aarav Sharma",
        decision="APPROVE",
        comments="Student body explicitly voted for grand Diwali banquet. The surplus will be amortized over lower consumption during post-exam weeks."
    )
    print(f"  [1/3 Signed] {sig1['signatures_recorded']['Student General Secretary (Mess)']['name']}: APPROVED")

    # Signatory 2: Mess Warden
    sig2 = gov.sign_approval(
        approval_id=approval_id,
        signatory_role="Mess Warden",
        signatory_name="Prof. K. R. Ramanathan",
        decision="APPROVE",
        comments="Approved as an exceptional cultural fest expenditure against hostel reserve corpus fund."
    )
    print(f"  [2/3 Signed] {sig2['signatures_recorded']['Mess Warden']['name']}: APPROVED (Quorum Reached)")

    # Signatory 3: Mess Manager
    sig3 = gov.sign_approval(
        approval_id=approval_id,
        signatory_role="Mess Manager",
        signatory_name="S. Sundaram",
        decision="APPROVE",
        comments="Verified supplier rates with APMC Mandi. Bulk discount applied on dry fruits and ghee."
    )
    print(f"  [3/3 Signed] {sig3['signatures_recorded']['Mess Manager']['name']}: APPROVED")

    print(f"\nFinal Approval Status: {sig3['status']}")
    print(f"Audit Log Total Entries: {len(audit_log.chain)}")
    print(f"Audit Log Cryptographic Chain Valid: {audit_log.verify_integrity()}")

    # Save execution trace
    trace_data = {
        "week_6_routine": week6_plan,
        "week_8_breach": week8_plan,
        "approval_gate_case": sig3,
        "audit_log": audit_log.to_list()
    }

    os.makedirs("docs", exist_ok=True)
    with open("docs/execution_trace.json", "w") as f:
        json.dump(trace_data, f, indent=2)

    print("\nSaved execution trace to docs/execution_trace.json")

if __name__ == "__main__":
    run_semester_cycle()
