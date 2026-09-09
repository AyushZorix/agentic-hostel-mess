"""
Operational Tools for Hostel Mess Operations Agent
Implements:
  1. nutrient_lookup(dish) -> USDA FoodData Central mapped nutritional profile
  2. cost_estimator(ingredients, student_count) -> Per-student & bulk batch cost
  3. leftover_checker(inventory) -> Flags perishables for Leftover-First rule
  4. vendor_price(item, quantity) -> Spot quote with volume tier discount
"""

import json
import os
from typing import Dict, List, Any, Optional

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

def load_json(filename: str):
    path = os.path.join(DATA_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

# Cache data
NUTRIENTS = load_json("usda_nutrients.json")
INDIAN_FOOD = {d["name"].lower(): d for d in load_json("indian_food_101.json")}
VENDOR_PRICES = {item["item"].lower(): item for item in load_json("vendor_prices.json")}
INVENTORY = load_json("mess_inventory.json")

# ICMR (Indian Council of Medical Research) Adult RDA Standards per student per day
ICMR_DAILY_TARGETS = {
    "calories_min": 2200,
    "calories_max": 2600,
    "protein_g_min": 65.0,
    "fat_g_max": 70.0,
    "fiber_g_min": 30.0,
    "iron_mg_min": 15.0,
    "calcium_mg_min": 600.0
}

def nutrient_lookup(dish: str) -> Dict[str, Any]:
    """
    Look up standardized USDA FoodData Central nutrient profiles for a given dish.
    Portion size is calibrated for university hostel mess serving.
    """
    cleaned = dish.strip()
    # Match exact or substring
    matched_key = None
    for name in NUTRIENTS:
        if cleaned.lower() in name.lower() or name.lower() in cleaned.lower():
            matched_key = name
            break
            
    if not matched_key:
        return {
            "dish": dish,
            "status": "NOT_FOUND",
            "message": f"Dish '{dish}' not found in USDA / Indian Food database.",
            "nutrients": {
                "portion_g": 250,
                "calories": 350,
                "protein_g": 8.0,
                "carbs_g": 55.0,
                "fat_g": 10.0,
                "fiber_g": 4.0,
                "iron_mg": 2.5,
                "calcium_mg": 60.0,
                "source": "ESTIMATED_AVERAGE"
            }
        }
        
    data = NUTRIENTS[matched_key]
    return {
        "dish": matched_key,
        "status": "FOUND",
        "nutrients": data
    }

def vendor_price(item: str, quantity: float = 1.0) -> Dict[str, Any]:
    """
    Look up current wholesale vendor pricing and bulk discount threshold.
    """
    cleaned = item.strip().lower()
    matched = None
    for v_name, v_data in VENDOR_PRICES.items():
        if cleaned in v_name or v_name in cleaned:
            matched = v_data
            break

    if not matched:
        return {
            "item": item,
            "status": "UNLISTED",
            "unit": "kg",
            "unit_price_inr": 45.0,
            "bulk_price_inr": 40.0,
            "bulk_threshold": 100,
            "effective_price_inr": 45.0 if quantity < 100 else 40.0,
            "supplier": "Local Open Market",
            "lead_time_days": 1
        }

    is_bulk = quantity >= matched.get("bulk_threshold", 999999)
    effective_price = matched["bulk_price_inr"] if is_bulk else matched["unit_price_inr"]
    total_cost = round(effective_price * quantity, 2)

    return {
        "item": matched["item"],
        "status": "FOUND",
        "category": matched["category"],
        "unit": matched["unit"],
        "unit_price_inr": matched["unit_price_inr"],
        "bulk_threshold": matched["bulk_threshold"],
        "bulk_price_inr": matched["bulk_price_inr"],
        "is_bulk_applied": is_bulk,
        "effective_price_inr": effective_price,
        "quantity": quantity,
        "total_cost_inr": total_cost,
        "supplier": matched["supplier"],
        "lead_time_days": matched["lead_time_days"],
        "shelf_life_days": matched["shelf_life_days"]
    }

def cost_estimator(dish_name: str, student_count: int = 500) -> Dict[str, Any]:
    """
    Estimate the total ingredient and per-plate cost for cooking a dish for N students.
    Uses standard hostel kitchen recipe proportions.
    """
    # Base ingredient mappings per 500 students
    # Standard mess batch recipes
    standard_batches: Dict[str, List[Dict[str, Any]]] = {
        "poha": [
            {"item": "Poha (Flattened Rice)", "qty": 40.0, "unit": "kg"},
            {"item": "Red Onions (Nashik Medium)", "qty": 15.0, "unit": "kg"},
            {"item": "Refined Mustard / Sunflower Oil", "qty": 5.0, "unit": "L"},
            {"item": "Indian Spice Box Combo", "qty": 1.5, "unit": "kg"}
        ],
        "idli sambar & chutney": [
            {"item": "Basmati Sella Rice", "qty": 35.0, "unit": "kg"},
            {"item": "Urad Dal Gota", "qty": 12.0, "unit": "kg"},
            {"item": "Toor Dal (Arhar)", "qty": 15.0, "unit": "kg"},
            {"item": "Hybrid Tomatoes", "qty": 10.0, "unit": "kg"},
            {"item": "Red Onions (Nashik Medium)", "qty": 8.0, "unit": "kg"}
        ],
        "aloo paratha with curd & pickle": [
            {"item": "Atta (Whole Wheat Flour)", "qty": 45.0, "unit": "kg"},
            {"item": "Potatoes (Agra Special)", "qty": 40.0, "unit": "kg"},
            {"item": "Plain Curd / Dahi", "qty": 50.0, "unit": "kg"},
            {"item": "Refined Mustard / Sunflower Oil", "qty": 6.0, "unit": "L"}
        ],
        "rajma masala with steamed rice": [
            {"item": "Rajma (Chitra Kidney Beans)", "qty": 35.0, "unit": "kg"},
            {"item": "Basmati Sella Rice", "qty": 50.0, "unit": "kg"},
            {"item": "Red Onions (Nashik Medium)", "qty": 18.0, "unit": "kg"},
            {"item": "Hybrid Tomatoes", "qty": 20.0, "unit": "kg"},
            {"item": "Ginger & Garlic Mix", "qty": 3.0, "unit": "kg"},
            {"item": "Refined Mustard / Sunflower Oil", "qty": 8.0, "unit": "L"}
        ],
        "paneer butter masala with butter roti": [
            {"item": "Fresh Malai Paneer", "qty": 55.0, "unit": "kg"},
            {"item": "Hybrid Tomatoes", "qty": 25.0, "unit": "kg"},
            {"item": "Table Butter", "qty": 8.0, "unit": "kg"},
            {"item": "Pasteurized Toned Milk", "qty": 15.0, "unit": "L"},
            {"item": "Atta (Whole Wheat Flour)", "qty": 45.0, "unit": "kg"}
        ],
        "dal tadka with jeera rice & roti": [
            {"item": "Toor Dal (Arhar)", "qty": 30.0, "unit": "kg"},
            {"item": "Chana Dal", "qty": 10.0, "unit": "kg"},
            {"item": "Basmati Sella Rice", "qty": 45.0, "unit": "kg"},
            {"item": "Atta (Whole Wheat Flour)", "qty": 35.0, "unit": "kg"},
            {"item": "Hybrid Tomatoes", "qty": 10.0, "unit": "kg"},
            {"item": "Desi Ghee (Pure Butterfat)", "qty": 3.0, "unit": "kg"}
        ],
        "chole bhature / chole kulche": [
            {"item": "Kabuli Chana (Chickpeas)", "qty": 38.0, "unit": "kg"},
            {"item": "Atta (Whole Wheat Flour)", "qty": 45.0, "unit": "kg"},
            {"item": "Red Onions (Nashik Medium)", "qty": 16.0, "unit": "kg"},
            {"item": "Hybrid Tomatoes", "qty": 18.0, "unit": "kg"},
            {"item": "Refined Mustard / Sunflower Oil", "qty": 10.0, "unit": "L"}
        ],
        "palak paneer with missi roti": [
            {"item": "Fresh Spinach (Palak)", "qty": 40.0, "unit": "kg"},
            {"item": "Fresh Malai Paneer", "qty": 45.0, "unit": "kg"},
            {"item": "Atta (Whole Wheat Flour)", "qty": 35.0, "unit": "kg"},
            {"item": "Besan (Gram Flour)", "qty": 15.0, "unit": "kg"},
            {"item": "Desi Ghee (Pure Butterfat)", "qty": 4.0, "unit": "kg"}
        ],
        "egg curry with jeera rice & chapati": [
            {"item": "Fresh Farm Eggs", "qty": 35.0, "unit": "tray (30 eggs)"}, # 1050 eggs
            {"item": "Basmati Sella Rice", "qty": 45.0, "unit": "kg"},
            {"item": "Atta (Whole Wheat Flour)", "qty": 35.0, "unit": "kg"},
            {"item": "Red Onions (Nashik Medium)", "qty": 18.0, "unit": "kg"},
            {"item": "Hybrid Tomatoes", "qty": 15.0, "unit": "kg"}
        ],
        "butter chicken with naan / roti": [
            {"item": "Broiler Chicken (Curry Cut)", "qty": 90.0, "unit": "kg"},
            {"item": "Hybrid Tomatoes", "qty": 28.0, "unit": "kg"},
            {"item": "Table Butter", "qty": 10.0, "unit": "kg"},
            {"item": "Atta (Whole Wheat Flour)", "qty": 45.0, "unit": "kg"}
        ]
    }

    key = dish_name.strip().lower()
    matched_ingredients = None
    for k, v in standard_batches.items():
        if k in key or key in k:
            matched_ingredients = v
            break

    scale = student_count / 500.0
    line_items = []
    total_batch_cost = 0.0

    if matched_ingredients:
        for ing in matched_ingredients:
            scaled_qty = round(ing["qty"] * scale, 2)
            vp = vendor_price(ing["item"], scaled_qty)
            cost = vp["total_cost_inr"]
            total_batch_cost += cost
            line_items.append({
                "item": vp["item"],
                "quantity": scaled_qty,
                "unit": vp["unit"],
                "rate": vp["effective_price_inr"],
                "cost_inr": cost
            })
    else:
        # Default fallback estimate
        base_cost_per_plate = 35.0
        total_batch_cost = base_cost_per_plate * student_count
        line_items = [
            {"item": "Composite Mess Ingredients", "quantity": round(120.0 * scale, 2), "unit": "kg", "rate": 45.0, "cost_inr": total_batch_cost}
        ]

    cost_per_plate = round(total_batch_cost / max(student_count, 1), 2)
    return {
        "dish": dish_name,
        "student_count": student_count,
        "line_items": line_items,
        "total_batch_cost_inr": round(total_batch_cost, 2),
        "cost_per_plate_inr": cost_per_plate
    }

def leftover_checker(inventory_data: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Inspects current pantry inventory for items with <= 3 days of shelf life.
    These must be prioritized into the upcoming Monday/Tuesday menu according to the
    'Leftover-First' mess rule to reduce organic waste.
    """
    inv = inventory_data or INVENTORY
    critical_leftovers = []
    stable_items = []

    for item in inv:
        days = item.get("days_to_expiry", 999)
        if days <= 3:
            critical_leftovers.append({
                "item": item["item"],
                "quantity": item["quantity"],
                "unit": item["unit"],
                "days_to_expiry": days,
                "urgency": item.get("urgency", "CRITICAL_LEFTOVER"),
                "recommended_dishes": _recommend_dishes_for_leftover(item["item"])
            })
        else:
            stable_items.append(item)

    return {
        "has_critical_leftovers": len(critical_leftovers) > 0,
        "critical_count": len(critical_leftovers),
        "critical_items": critical_leftovers,
        "rule_guideline": "Mandatory Leftover-First Rule: The Menu Coordinator must schedule dishes containing these items into Monday or Tuesday meals before placing new vendor purchase orders."
    }

def _recommend_dishes_for_leftover(item_name: str) -> List[str]:
    name = item_name.lower()
    if "tomato" in name:
        return ["Rajma Masala with Steamed Rice", "Paneer Butter Masala with Butter Roti", "Dal Tadka with Jeera Rice & Roti"]
    elif "cauliflower" in name:
        return ["Aloo Gobi Matar with Phulka", "Vegetable Biryani with Boondi Raita"]
    elif "spinach" in name or "palak" in name:
        return ["Palak Paneer with Missi Roti"]
    elif "curd" in name or "dahi" in name:
        return ["Kadhi Pakoda with Steamed Rice", "Aloo Paratha with Curd & Pickle", "Vegetable Biryani with Boondi Raita"]
    return ["Mixed Veg Sabzi", "Khichdi"]

if __name__ == "__main__":
    print("Testing nutrient_lookup:")
    print(nutrient_lookup("Paneer Butter Masala with Butter Roti"))
    print("\nTesting vendor_price:")
    print(vendor_price("Fresh Malai Paneer", 60))
    print("\nTesting cost_estimator:")
    print(cost_estimator("Rajma Masala with Steamed Rice", 500))
    print("\nTesting leftover_checker:")
    print(leftover_checker())
