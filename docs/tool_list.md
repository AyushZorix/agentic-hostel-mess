# Operational Tool List & Specification

This document details the tool interfaces and protocols utilized by the Hostel Mess Operations Agent swarm.

---

## 1. Core Operational Tools

### Tool 1: `nutrient_lookup`
- **Purpose**: Retrieves nutrient composition and portion scaling for dishes mapped from USDA FoodData Central and curated Indian culinary recipes.
- **Function Signature**: `nutrient_lookup(dish: str) -> Dict[str, Any]`
- **Input Parameters**:
  - `dish` (string, required): Full or partial name of the dish (e.g., `"Paneer Butter Masala with Butter Roti"`, `"Poha"`).
- **Return Value**:
  ```json
  {
    "dish": "Paneer Butter Masala with Butter Roti",
    "status": "FOUND",
    "nutrients": {
      "portion_g": 380,
      "calories": 640,
      "protein_g": 24.8,
      "carbs_g": 52.0,
      "fat_g": 38.0,
      "fiber_g": 5.2,
      "iron_mg": 3.1,
      "calcium_mg": 340.0,
      "source": "USDA-FDC-170889"
    }
  }
  ```

---

### Tool 2: `cost_estimator`
- **Purpose**: Computes batch ingredient costs and per-student plate cost based on standardized university mess recipe proportions and live vendor pricing.
- **Function Signature**: `cost_estimator(dish_name: str, student_count: int = 500) -> Dict[str, Any]`
- **Input Parameters**:
  - `dish_name` (string, required): Target meal name.
  - `student_count` (integer, optional, default: 500): Hostel resident count.
- **Return Value**:
  ```json
  {
    "dish": "Rajma Masala with Steamed Rice",
    "student_count": 500,
    "line_items": [
      { "item": "Rajma (Chitra Kidney Beans)", "quantity": 35.0, "unit": "kg", "rate": 135.0, "cost_inr": 4725.0 },
      { "item": "Basmati Sella Rice", "quantity": 50.0, "unit": "kg", "rate": 58.0, "cost_inr": 2900.0 },
      { "item": "Red Onions (Nashik Medium)", "quantity": 18.0, "unit": "kg", "rate": 28.0, "cost_inr": 504.0 },
      { "item": "Hybrid Tomatoes", "quantity": 20.0, "unit": "kg", "rate": 36.0, "cost_inr": 720.0 }
    ],
    "total_batch_cost_inr": 10249.0,
    "cost_per_plate_inr": 20.50
  }
  ```

---

### Tool 3: `leftover_checker`
- **Purpose**: Scans current hostel pantry inventory to identify perishable items with `<= 3 days` remaining shelf life, enforcing the Leftover-First heuristic.
- **Function Signature**: `leftover_checker(inventory_data: Optional[List[Dict]] = None) -> Dict[str, Any]`
- **Input Parameters**:
  - `inventory_data` (list of objects, optional): Custom pantry snapshot or defaults to live database.
- **Return Value**:
  ```json
  {
    "has_critical_leftovers": true,
    "critical_count": 4,
    "critical_items": [
      {
        "item": "Hybrid Tomatoes",
        "quantity": 48.0,
        "unit": "kg",
        "days_to_expiry": 2,
        "urgency": "CRITICAL_LEFTOVER",
        "recommended_dishes": ["Rajma Masala with Steamed Rice", "Paneer Butter Masala"]
      }
    ],
    "rule_guideline": "Mandatory Leftover-First Rule: The Menu Coordinator must schedule dishes containing these items into Monday or Tuesday meals."
  }
  ```

---

### Tool 4: `vendor_price`
- **Purpose**: Looks up wholesale contracted mandi prices, bulk tier thresholds, and supplier lead times.
- **Function Signature**: `vendor_price(item: str, quantity: float = 1.0) -> Dict[str, Any]`
- **Input Parameters**:
  - `item` (string, required): Raw ingredient name.
  - `quantity` (float, optional, default: 1.0): Order volume.
- **Return Value**:
  ```json
  {
    "item": "Fresh Malai Paneer",
    "status": "FOUND",
    "category": "Dairy",
    "unit": "kg",
    "unit_price_inr": 340.0,
    "bulk_threshold": 50,
    "bulk_price_inr": 315.0,
    "is_bulk_applied": true,
    "effective_price_inr": 315.0,
    "quantity": 60,
    "total_cost_inr": 18900.0,
    "supplier": "Amul Cooperative Wholesaler",
    "lead_time_days": 1,
    "shelf_life_days": 3
  }
  ```

---

## 2. Model Context Protocol (MCP) Endpoints

The MCP server runs over JSON-RPC 2.0 and exposes:

| Endpoint Type | Identifier | Description |
|---|---|---|
| **Resource** | `mess://vendor-prices` | Full APMC Mandi wholesale price catalog with bulk discount breakpoints |
| **Resource** | `mess://inventory` | Real-time pantry stock, batch lot numbers, and expiration countdowns |
| **Tool** | `vendor_price_list` | Filterable catalog by category and maximum price |
| **Tool** | `inventory_table` | Filterable inventory table with `filter_expiring_only: true` |
| **Tool** | `mock_ordering_api` | Issues purchase orders with budget ceiling enforcement and PO generation |
