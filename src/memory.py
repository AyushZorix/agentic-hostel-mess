"""
Dual-Tier Memory Manager for Hostel Mess Operations Agent
Manages:
  - Ephemeral Session State (Active week draft, scratchpad, conflict tracker)
  - Durable Long-Term Memory (Past ratings, plate waste audits, recurring complaints)
"""

import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

class SessionState:
    def __init__(self, semester_week: int = 6):
        self.cycle_id = f"CYCLE-2026-W{semester_week:02d}"
        self.semester_week = semester_week
        self.planning_stage = "INITIALIZED"
        self.draft_revision = 1
        self.current_draft: Dict[str, Any] = {}
        self.active_conflicts: List[Dict[str, Any]] = []
        self.leftovers_allocated: List[Dict[str, Any]] = []
        self.running_cost_estimate_inr: float = 0.0
        self.scratchpad: List[str] = []

    def record_conflict(self, conflict_id: str, agents: List[str], description: str, resolution: str = ""):
        self.active_conflicts.append({
            "conflict_id": conflict_id,
            "agents_involved": agents,
            "description": description,
            "resolution": resolution,
            "status": "RESOLVED" if resolution else "OPEN",
            "timestamp": datetime.utcnow().isoformat()
        })

    def allocate_leftover(self, item: str, quantity: float, meal: str):
        self.leftovers_allocated.append({
            "item": item,
            "quantity_kg": quantity,
            "assigned_meal": meal
        })

    def to_dict(self) -> Dict[str, Any]:
        return {
            "cycle_id": self.cycle_id,
            "semester_week": self.semester_week,
            "planning_stage": self.planning_stage,
            "draft_revision": self.draft_revision,
            "current_draft": self.current_draft,
            "active_conflicts": self.active_conflicts,
            "leftovers_allocated": self.leftovers_allocated,
            "running_cost_estimate_inr": self.running_cost_estimate_inr,
            "scratchpad": self.scratchpad
        }

class LongTermMemory:
    def __init__(self):
        self.historical_weekly_ratings = [
            {"week_number": 1, "overall_rating": 3.9, "highest_rated_dish": "Chole Bhature", "lowest_rated_dish": "Kadhi Pakoda", "turnout_percent": 94.2},
            {"week_number": 2, "overall_rating": 4.1, "highest_rated_dish": "Paneer Butter Masala", "lowest_rated_dish": "Upma", "turnout_percent": 96.0},
            {"week_number": 3, "overall_rating": 4.3, "highest_rated_dish": "Butter Chicken", "lowest_rated_dish": "Baingan Bharta", "turnout_percent": 95.5},
            {"week_number": 4, "overall_rating": 3.8, "highest_rated_dish": "Aloo Paratha", "lowest_rated_dish": "Aloo Gobi Matar", "turnout_percent": 89.0},
            {"week_number": 5, "overall_rating": 4.4, "highest_rated_dish": "Vegetable Biryani", "lowest_rated_dish": "Poha", "turnout_percent": 97.1}
        ]

        self.plate_waste_audits = [
            {"dish_name": "Kadhi Pakoda with Steamed Rice", "average_waste_percentage": 31.5, "complaint_driver": "Sour curd level unpalatable; soggy pakoda texture", "penalty_weight": 0.5},
            {"dish_name": "Upma with Coconut Chutney", "average_waste_percentage": 27.2, "complaint_driver": "Dry and clumpy consistency", "penalty_weight": 0.6},
            {"dish_name": "Baingan Bharta with Bajra Roti", "average_waste_percentage": 29.0, "complaint_driver": "Seeds not removed, high oiliness", "penalty_weight": 0.55},
            {"dish_name": "Paneer Butter Masala with Butter Roti", "average_waste_percentage": 2.3, "complaint_driver": "None - empty pots", "penalty_weight": 1.2},
            {"dish_name": "Rajma Masala with Steamed Rice", "average_waste_percentage": 4.1, "complaint_driver": "Good gravy consistency", "penalty_weight": 1.15},
            {"dish_name": "Butter Chicken with Naan / Roti", "average_waste_percentage": 1.8, "complaint_driver": "High student demand", "penalty_weight": 1.3}
        ]

        self.recurring_student_complaints = [
            {
                "complaint_id": "CMP-001",
                "category": "TEXTURE",
                "summary": "Dal is too watery and thin on Tuesdays.",
                "occurrence_count": 8,
                "actionable_heuristic": "Mandate pulse-to-water ratio of 1:4 and blend 25% Chana dal with Toor dal to ensure thick comforting texture."
            },
            {
                "complaint_id": "CMP-002",
                "category": "QUANTITY",
                "summary": "Insufficient protein for gym and athletics students.",
                "occurrence_count": 14,
                "actionable_heuristic": "Enforce minimum 70g daily protein baseline per student; offer boiled eggs or chana sundal in evening snacks."
            },
            {
                "complaint_id": "CMP-003",
                "category": "REPETITION",
                "summary": "Too many potato (aloo) dishes in consecutive meals.",
                "occurrence_count": 11,
                "actionable_heuristic": "Hard ceiling: No more than 3 potato-heavy meals in any 7-day planning cycle."
            }
        ]

        self.vendor_reliability_scores = [
            {"supplier_name": "Shree Ganesh Agro", "on_time_delivery_rate": 0.98, "freshness_rating": 4.7, "price_competitiveness": 4.9},
            {"supplier_name": "Kisan Pulse Mill", "on_time_delivery_rate": 0.95, "freshness_rating": 4.8, "price_competitiveness": 4.6},
            {"supplier_name": "Amul Cooperative Wholesaler", "on_time_delivery_rate": 0.99, "freshness_rating": 4.9, "price_competitiveness": 4.5},
            {"supplier_name": "Azadpur Mandi Direct", "on_time_delivery_rate": 0.91, "freshness_rating": 4.2, "price_competitiveness": 4.8},
            {"supplier_name": "Venkateshwara Hatcheries", "on_time_delivery_rate": 0.97, "freshness_rating": 4.8, "price_competitiveness": 4.4}
        ]

    def get_waste_penalty(self, dish_name: str) -> float:
        for audit in self.plate_waste_audits:
            if audit["dish_name"].lower() in dish_name.lower() or dish_name.lower() in audit["dish_name"].lower():
                return audit["penalty_weight"]
        return 1.0

    def get_heuristics_for_agents(self) -> List[str]:
        return [c["actionable_heuristic"] for c in self.recurring_student_complaints]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "historical_weekly_ratings": self.historical_weekly_ratings,
            "plate_waste_audits": self.plate_waste_audits,
            "recurring_student_complaints": self.recurring_student_complaints,
            "vendor_reliability_scores": self.vendor_reliability_scores
        }
