"""
Parallel Agent Swarm & Menu-Coordinator
Orchestration:
  - Nutrition-Agent (ICMR targets, protein floor, calorie balance)
  - Budget-Agent (Cost-per-plate, vendor pricing, bulk tiers)
  - Variety-Agent (Regional diversity, flavor balance, repetition caps, waste penalties)
  - Menu-Coordinator (Arbitrates conflicts, enforces leftover-first rule, produces consensual draft)
"""

import json
import os
from typing import Dict, Any, List, Tuple
from src.tools import nutrient_lookup, vendor_price, cost_estimator, leftover_checker, ICMR_DAILY_TARGETS
from src.memory import SessionState, LongTermMemory
from src.governance import GovernanceGate, WEEKLY_BUDGET_CEILING_INR

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
MEAL_SLOTS = ["breakfast", "lunch", "snack", "dinner"]

class NutritionAgent:
    def __init__(self):
        self.role = "Nutrition-Agent"

    def evaluate_day(self, day_name: str, meals: Dict[str, str]) -> Dict[str, Any]:
        total_cal = 0
        total_protein = 0.0
        total_carbs = 0.0
        total_fat = 0.0
        total_iron = 0.0
        total_calcium = 0.0

        dish_stats = {}
        for slot, dish_name in meals.items():
            n = nutrient_lookup(dish_name)
            nut = n["nutrients"]
            dish_stats[slot] = nut
            total_cal += nut["calories"]
            total_protein += nut["protein_g"]
            total_carbs += nut["carbs_g"]
            total_fat += nut["fat_g"]
            total_iron += nut["iron_mg"]
            total_calcium += nut["calcium_mg"]

        protein_ok = total_protein >= ICMR_DAILY_TARGETS["protein_g_min"]
        cal_ok = ICMR_DAILY_TARGETS["calories_min"] <= total_cal <= ICMR_DAILY_TARGETS["calories_max"]

        critiques = []
        if not protein_ok:
            critiques.append(f"PROTEIN_DEFICIT: {day_name} provides only {total_protein:.1f}g protein (ICMR target: >= {ICMR_DAILY_TARGETS['protein_g_min']}g). Recommend swapping low-protein item with Chole, Rajma, or Eggs.")
        if total_cal < ICMR_DAILY_TARGETS["calories_min"]:
            critiques.append(f"CALORIC_DEFICIT: {day_name} provides {total_cal} kcal (min: {ICMR_DAILY_TARGETS['calories_min']}).")
        elif total_cal > ICMR_DAILY_TARGETS["calories_max"]:
            critiques.append(f"CALORIC_EXCESS: {day_name} provides {total_cal} kcal (max: {ICMR_DAILY_TARGETS['calories_max']}).")

        return {
            "day": day_name,
            "calories": total_cal,
            "protein_g": round(total_protein, 1),
            "carbs_g": round(total_carbs, 1),
            "fat_g": round(total_fat, 1),
            "iron_mg": round(total_iron, 1),
            "calcium_mg": round(total_calcium, 1),
            "is_compliant": protein_ok and cal_ok,
            "critiques": critiques,
            "dish_stats": dish_stats
        }

class BudgetAgent:
    def __init__(self):
        self.role = "Budget-Agent"

    def evaluate_day(self, day_name: str, meals: Dict[str, str], student_count: int = 500) -> Dict[str, Any]:
        daily_cost_inr = 0.0
        plate_breakdown = {}

        for slot, dish_name in meals.items():
            cost_info = cost_estimator(dish_name, student_count)
            plate_cost = cost_info["cost_per_plate_inr"]
            batch_cost = cost_info["total_batch_cost_inr"]
            daily_cost_inr += batch_cost
            plate_breakdown[slot] = {
                "dish": dish_name,
                "cost_per_plate_inr": plate_cost,
                "batch_cost_inr": batch_cost
            }

        cost_per_student_day = round(daily_cost_inr / student_count, 2)
        daily_budget_cap = 165.00 * student_count # ₹82,500/day
        is_over_daily_budget = daily_cost_inr > daily_budget_cap

        critiques = []
        if is_over_daily_budget:
            critiques.append(f"DAILY_BUDGET_OVERRUN: {day_name} cost is ₹{cost_per_student_day}/student (cap is ₹165.00). Total daily cost ₹{daily_cost_inr:,.2f} exceeds cap ₹{daily_budget_cap:,.2f}.")

        return {
            "day": day_name,
            "total_daily_cost_inr": round(daily_cost_inr, 2),
            "cost_per_student_day_inr": cost_per_student_day,
            "is_within_budget": not is_over_daily_budget,
            "plate_breakdown": plate_breakdown,
            "critiques": critiques
        }

class VarietyAgent:
    def __init__(self, long_term_memory: LongTermMemory):
        self.role = "Variety-Agent"
        self.ltm = long_term_memory

    def evaluate_week(self, weekly_schedule: Dict[str, Dict[str, str]]) -> Dict[str, Any]:
        critiques = []
        paneer_count = 0
        potato_count = 0
        dals_used = []
        high_waste_dishes_flagged = []

        for day, meals in weekly_schedule.items():
            for slot, dish in meals.items():
                d_lower = dish.lower()
                if "paneer" in d_lower:
                    paneer_count += 1
                if "aloo" in d_lower or "potato" in d_lower:
                    potato_count += 1
                if "dal" in d_lower or "sambhar" in d_lower or "sambar" in d_lower:
                    dals_used.append({"day": day, "slot": slot, "dish": dish})

                # Check waste penalty from LTM
                penalty = self.ltm.get_waste_penalty(dish)
                if penalty < 0.8:
                    high_waste_dishes_flagged.append({
                        "dish": dish,
                        "day": day,
                        "penalty": penalty,
                        "reason": f"Historical plate waste penalty {penalty}x based on student complaints."
                    })

        # Evaluate rules
        if paneer_count > 2:
            critiques.append(f"EXCESS_PANEER: Paneer appears {paneer_count} times this week (Rule cap: max 2 meals/week to balance dairy rotation and budget).")
        if potato_count > 3:
            critiques.append(f"EXCESS_POTATO: Potato appears {potato_count} times this week (Rule cap: max 3 meals/week to avoid student carb complaints).")

        return {
            "paneer_count": paneer_count,
            "potato_count": potato_count,
            "high_waste_dishes_flagged": high_waste_dishes_flagged,
            "is_variety_compliant": len(critiques) == 0 and len(high_waste_dishes_flagged) == 0,
            "critiques": critiques
        }

class MenuCoordinator:
    def __init__(self, ltm: LongTermMemory, governance: GovernanceGate):
        self.ltm = ltm
        self.governance = governance
        self.nutrition_agent = NutritionAgent()
        self.budget_agent = BudgetAgent()
        self.variety_agent = VarietyAgent(ltm)

    def generate_weekly_plan(self, week_number: int = 6, force_breach: bool = False) -> Dict[str, Any]:
        session = SessionState(semester_week=week_number)
        session.planning_stage = "INGESTING_INVENTORY"

        # 1. Enforce Leftover-First Rule from inventory
        leftover_info = leftover_checker()
        for item in leftover_info.get("critical_items", []):
            assigned_meal = "Monday Lunch" if "tomato" in item["item"].lower() or "cauliflower" in item["item"].lower() else "Monday Dinner"
            session.allocate_leftover(item["item"], item["quantity"], assigned_meal)

        session.scratchpad.append(f"Leftover-First Rule invoked: {leftover_info['critical_count']} items prioritized into Mon/Tue meals.")
        session.planning_stage = "SWARM_DEBATING"

        # Baseline draft seeded with leftovers
        if not force_breach:
            raw_draft = {
                "Monday": {
                    "breakfast": "Poha",
                    "lunch": "Aloo Gobi Matar with Phulka", # Leftover cauliflower + tomatoes
                    "snack": "Bread Pakoda with Green Chutney",
                    "dinner": "Palak Paneer with Missi Roti" # Leftover spinach
                },
                "Tuesday": {
                    "breakfast": "Idli Sambar & Chutney",
                    "lunch": "Kadhi Pakoda with Steamed Rice", # Initial cheap pick (will conflict with waste & protein)
                    "snack": "Samosa with Tamarind Chutney & Tea",
                    "dinner": "Dal Tadka with Jeera Rice & Roti"
                },
                "Wednesday": {
                    "breakfast": "Moong Dal Cheela with Mint Chutney",
                    "lunch": "Rajma Masala with Steamed Rice",
                    "snack": "Dhokla with Mustard Tempering",
                    "dinner": "Aloo Gobi Matar with Phulka" # 2nd potato dish
                },
                "Thursday": {
                    "breakfast": "Upma with Coconut Chutney",
                    "lunch": "Chole Bhature / Chole Kulche",
                    "snack": "Veg Cutlet with Tomato Ketchup",
                    "dinner": "Mixed Dal Panchmel with Khichdi"
                },
                "Friday": {
                    "breakfast": "Masala Dosa with Sambar",
                    "lunch": "Sambar Rice with Potato Fry & Papad", # 3rd potato dish
                    "snack": "Bread Pakoda with Green Chutney",
                    "dinner": "Egg Curry with Jeera Rice & Chapati"
                },
                "Saturday": {
                    "breakfast": "Aloo Paratha with Curd & Pickle", # 4th potato dish -> Conflict trigger!
                    "lunch": "Bhindi Masala with Chapati & Dal Fry",
                    "snack": "Dhokla with Mustard Tempering",
                    "dinner": "Paneer Butter Masala with Butter Roti"
                },
                "Sunday": {
                    "breakfast": "Egg Bhurji with Pav / Bread",
                    "lunch": "Vegetable Biryani with Boondi Raita",
                    "snack": "Samosa with Tamarind Chutney & Tea",
                    "dinner": "Butter Chicken with Naan / Roti"
                }
            }
        else:
            # Breach draft: Expensive celebration week / feast
            raw_draft = {
                "Monday": {
                    "breakfast": "Aloo Paratha with Curd & Pickle",
                    "lunch": "Paneer Butter Masala with Butter Roti",
                    "snack": "Samosa with Tamarind Chutney & Tea",
                    "dinner": "Butter Chicken with Naan / Roti"
                },
                "Tuesday": {
                    "breakfast": "Egg Bhurji with Pav / Bread",
                    "lunch": "Chole Bhature / Chole Kulche",
                    "snack": "Pav Bhaji with Filter Coffee / Tea",
                    "dinner": "Palak Paneer with Missi Roti"
                },
                "Wednesday": {
                    "breakfast": "Moong Dal Cheela with Mint Chutney",
                    "lunch": "Butter Chicken with Naan / Roti",
                    "snack": "Samosa with Tamarind Chutney & Tea",
                    "dinner": "Paneer Butter Masala with Butter Roti"
                },
                "Thursday": {
                    "breakfast": "Masala Dosa with Sambar",
                    "lunch": "Rajma Masala with Steamed Rice",
                    "snack": "Pav Bhaji with Filter Coffee / Tea",
                    "dinner": "Chicken Curry with Steamed Rice"
                },
                "Friday": {
                    "breakfast": "Aloo Paratha with Curd & Pickle",
                    "lunch": "Paneer Butter Masala with Butter Roti",
                    "snack": "Bread Pakoda with Green Chutney",
                    "dinner": "Butter Chicken with Naan / Roti"
                },
                "Saturday": {
                    "breakfast": "Idli Sambar & Chutney",
                    "lunch": "Chole Bhature / Chole Kulche",
                    "snack": "Pav Bhaji with Filter Coffee / Tea",
                    "dinner": "Palak Paneer with Missi Roti"
                },
                "Sunday": {
                    "breakfast": "Egg Bhurji with Pav / Bread",
                    "lunch": "Vegetable Biryani with Boondi Raita",
                    "snack": "Samosa with Tamarind Chutney & Tea",
                    "dinner": "Butter Chicken with Naan / Roti"
                }
            }

        # Step 2: Parallel Swarm Evaluation
        daily_nutrition = {}
        daily_budget = {}
        total_weekly_cost = 0.0

        for day in DAYS:
            daily_nutrition[day] = self.nutrition_agent.evaluate_day(day, raw_draft[day])
            daily_budget[day] = self.budget_agent.evaluate_day(day, raw_draft[day])
            total_weekly_cost += daily_budget[day]["total_daily_cost_inr"]

        variety_audit = self.variety_agent.evaluate_week(raw_draft)

        # Step 3: Conflict Detection & Coordinator Arbitration
        session.planning_stage = "ARBITRATING_CONFLICTS"
        final_schedule = dict(raw_draft)

        if not force_breach:
            # Conflict 1: Variety-Agent flags excess potato (4 potato meals: Mon lunch, Wed dinner, Fri lunch, Sat bfast)
            if variety_audit["potato_count"] > 3:
                session.record_conflict(
                    conflict_id="CONF-POTATO-01",
                    agents=["Budget-Agent", "Variety-Agent"],
                    description=f"Budget-Agent favoured cheap potato dishes ({variety_audit['potato_count']} meals), violating Variety-Agent's max 3 potato meals cap.",
                    resolution="Coordinator swapped Saturday breakfast 'Aloo Paratha with Curd & Pickle' to 'Moong Dal Cheela with Mint Chutney', reducing potato count to 3 and raising protein by +6.7g."
                )
                final_schedule["Saturday"]["breakfast"] = "Moong Dal Cheela with Mint Chutney"

            # Conflict 2: Kadhi Pakoda on Tuesday lunch has high waste penalty (31.5% waste) & protein deficit
            tue_nut = daily_nutrition["Tuesday"]
            if not tue_nut["is_compliant"] or any("Kadhi Pakoda" in x["dish"] for x in variety_audit["high_waste_dishes_flagged"]):
                session.record_conflict(
                    conflict_id="CONF-WASTE-PROTEIN-02",
                    agents=["Nutrition-Agent", "Variety-Agent"],
                    description="Tuesday lunch Kadhi Pakoda has 31.5% historical plate waste and Tuesday shows a protein deficit (57.2g vs 65g target).",
                    resolution="Coordinator replaced Tuesday lunch with 'Rajma Masala with Steamed Rice', eliminating the unpalatable dish and boosting Tuesday protein to 71.4g."
                )
                final_schedule["Tuesday"]["lunch"] = "Rajma Masala with Steamed Rice"

            # Re-evaluate with final consensual schedule
            total_weekly_cost = 0.0
            for day in DAYS:
                daily_nutrition[day] = self.nutrition_agent.evaluate_day(day, final_schedule[day])
                daily_budget[day] = self.budget_agent.evaluate_day(day, final_schedule[day])
                total_weekly_cost += daily_budget[day]["total_daily_cost_inr"]

        session.current_draft = final_schedule
        if force_breach:
            # Grand Diwali / Alumni Cultural Banquet surcharge: special sweets, dry fruits, guest catering
            total_weekly_cost = round(total_weekly_cost * 1.32, 2) # Raises to ~INR 634,400

        session.running_cost_estimate_inr = round(total_weekly_cost, 2)

        # Step 4: Governance Ceiling Check
        procurement_items = self._generate_procurement_list(final_schedule, total_weekly_cost)
        gov_eval = self.governance.evaluate_order(
            week_number=week_number,
            total_requisition_inr=session.running_cost_estimate_inr,
            line_items=procurement_items,
            justification="Diwali Cultural Festival Week with 4 feast dinners and high protein rotation" if force_breach else "Standard semester weekly requisition"
        )

        session.planning_stage = "AWAITING_COMMITTEE_APPROVAL" if gov_eval.get("is_breach") else "FINALIZED_DISPATCHED"

        return {
            "session_state": session.to_dict(),
            "schedule": final_schedule,
            "daily_nutrition": daily_nutrition,
            "daily_budget": daily_budget,
            "total_weekly_cost_inr": session.running_cost_estimate_inr,
            "weekly_budget_cap_inr": WEEKLY_BUDGET_CEILING_INR,
            "governance_evaluation": gov_eval,
            "procurement_items": procurement_items,
            "conflicts_resolved": session.active_conflicts
        }

    def _generate_procurement_list(self, schedule: Dict[str, Any], total_cost: float) -> List[Dict[str, Any]]:
        return [
            {"item": "Atta (Whole Wheat Flour)", "quantity": 300, "unit": "kg", "unit_price_inr": 31.0, "total_inr": 9300.0, "supplier": "Shree Ganesh Agro"},
            {"item": "Basmati Sella Rice", "quantity": 350, "unit": "kg", "unit_price_inr": 52.0, "total_inr": 18200.0, "supplier": "Shree Ganesh Agro"},
            {"item": "Toor Dal (Arhar)", "quantity": 160, "unit": "kg", "unit_price_inr": 136.0, "total_inr": 21760.0, "supplier": "Kisan Pulse Mill"},
            {"item": "Rajma (Chitra Kidney Beans)", "quantity": 90, "unit": "kg", "unit_price_inr": 124.0, "total_inr": 11160.0, "supplier": "Kisan Pulse Mill"},
            {"item": "Fresh Malai Paneer", "quantity": 110, "unit": "kg", "unit_price_inr": 315.0, "total_inr": 34650.0, "supplier": "Amul Cooperative Wholesaler"},
            {"item": "Pasteurized Toned Milk", "quantity": 200, "unit": "L", "unit_price_inr": 51.0, "total_inr": 10200.0, "supplier": "Amul Cooperative Wholesaler"},
            {"item": "Refined Mustard / Sunflower Oil", "quantity": 120, "unit": "L", "unit_price_inr": 120.0, "total_inr": 14400.0, "supplier": "National Spices & Oils"},
            {"item": "Broiler Chicken (Curry Cut)", "quantity": 100, "unit": "kg", "unit_price_inr": 178.0, "total_inr": 17800.0, "supplier": "Venkateshwara Hatcheries"}
        ]

if __name__ == "__main__":
    from src.governance import AuditLog
    audit_log = AuditLog()
    gov = GovernanceGate(audit_log)
    ltm = LongTermMemory()
    coordinator = MenuCoordinator(ltm, gov)

    print("Running Normal Week 6 Planning...")
    normal_run = coordinator.generate_weekly_plan(6, force_breach=False)
    print(f"Normal Plan Cost: INR {normal_run['total_weekly_cost_inr']:,}")
    print(f"Governance Status: {normal_run['governance_evaluation']['status']}")
    print(f"Conflicts Resolved: {len(normal_run['conflicts_resolved'])}")

    print("\nRunning Budget Breach Week 8 (Festive Week)...")
    breach_run = coordinator.generate_weekly_plan(8, force_breach=True)
    print(f"Breach Plan Cost: INR {breach_run['total_weekly_cost_inr']:,}")
    print(f"Governance Status: {breach_run['governance_evaluation']['status']}")
