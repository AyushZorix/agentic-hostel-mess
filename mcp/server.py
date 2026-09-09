"""
Model Context Protocol (MCP) Server for Hostel Mess Operations
Exposes:
  - Resources:
      * mess://vendor-prices (Current vendor catalog and volume tiers)
      * mess://inventory (Real-time pantry stock and expiration dates)
  - Tools:
      * vendor_price_list(category: str, max_price: float)
      * inventory_table(filter_expiring: bool)
      * mock_ordering_api(items: list, requested_by: str, week_number: int, notes: str)
"""

import sys
import json
import os
from typing import Dict, Any, List

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

def load_data(filename: str):
    path = os.path.join(DATA_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

class MessMCPServer:
    def __init__(self):
        self.vendor_prices = load_data("vendor_prices.json")
        self.inventory = load_data("mess_inventory.json")
        self.orders_history = []
        self.weekly_budget_cap = 577500.0 # 500 students * 165/day * 7 days

    def list_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": "vendor_price_list",
                "description": "Fetch wholesale vendor prices with bulk volume tier discounts and supplier info.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "category": {"type": "string", "description": "Optional category filter: 'Vegetables', 'Dairy', 'Pulses & Legumes', etc."},
                        "max_price": {"type": "number", "description": "Optional max unit price filter in INR"}
                    }
                }
            },
            {
                "name": "inventory_table",
                "description": "Inspect current mess pantry stock levels, batch IDs, and days-to-expiration countdown.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "filter_expiring_only": {"type": "boolean", "description": "If true, only return perishables with <= 3 days shelf life."}
                    }
                }
            },
            {
                "name": "mock_ordering_api",
                "description": "Submit a wholesale purchase requisition to contracted suppliers. Enforces budget checking.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "items": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "item": {"type": "string"},
                                    "quantity": {"type": "number"},
                                    "unit": {"type": "string"}
                                },
                                "required": ["item", "quantity"]
                            },
                            "description": "List of ingredients and quantities to order"
                        },
                        "week_number": {"type": "integer", "description": "Semester week number (1-16)"},
                        "requested_by": {"type": "string", "description": "Agent or committee member initiating order"},
                        "notes": {"type": "string", "description": "Requisition justification / notes"}
                    },
                    "required": ["items", "week_number", "requested_by"]
                }
            }
        ]

    def list_resources(self) -> List[Dict[str, Any]]:
        return [
            {
                "uri": "mess://vendor-prices",
                "name": "Hostel Mess Vendor Catalog",
                "mimeType": "application/json",
                "description": "Live wholesale price list from contracted APMC Mandi and dairy suppliers"
            },
            {
                "uri": "mess://inventory",
                "name": "Hostel Mess Pantry Inventory",
                "mimeType": "application/json",
                "description": "Current on-hand raw material stock with expiration dates"
            }
        ]

    def handle_tool_call(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        if name == "vendor_price_list":
            cat = arguments.get("category")
            max_p = arguments.get("max_price")
            results = self.vendor_prices
            if cat:
                results = [item for item in results if cat.lower() in item.get("category", "").lower()]
            if max_p is not None:
                results = [item for item in results if item.get("unit_price_inr", 0) <= max_p]
            return {"items": results, "count": len(results)}

        elif name == "inventory_table":
            expiring_only = arguments.get("filter_expiring_only", False)
            if expiring_only:
                filtered = [item for item in self.inventory if item.get("days_to_expiry", 999) <= 3]
                return {"inventory": filtered, "count": len(filtered), "type": "EXPIRING_PERISHABLES"}
            return {"inventory": self.inventory, "count": len(self.inventory), "type": "FULL_PANTRY"}

        elif name == "mock_ordering_api":
            items = arguments.get("items", [])
            week = arguments.get("week_number", 6)
            requested_by = arguments.get("requested_by", "Menu-Coordinator")
            notes = arguments.get("notes", "Weekly mess ingredient requisition")

            # Calculate price
            total_order_inr = 0.0
            order_line_items = []

            price_lookup = {item["item"].lower(): item for item in self.vendor_prices}

            for req in items:
                req_name = req["item"].lower()
                matched = None
                for v_name, v_data in price_lookup.items():
                    if req_name in v_name or v_name in req_name:
                        matched = v_data
                        break

                qty = req["quantity"]
                if matched:
                    is_bulk = qty >= matched.get("bulk_threshold", 999999)
                    unit_price = matched["bulk_price_inr"] if is_bulk else matched["unit_price_inr"]
                    cost = round(unit_price * qty, 2)
                    order_line_items.append({
                        "item": matched["item"],
                        "supplier": matched["supplier"],
                        "quantity": qty,
                        "unit": matched["unit"],
                        "unit_price": unit_price,
                        "bulk_discount": is_bulk,
                        "cost_inr": cost
                    })
                    total_order_inr += cost
                else:
                    cost = round(qty * 45.0, 2)
                    order_line_items.append({
                        "item": req["item"],
                        "supplier": "Local Market",
                        "quantity": qty,
                        "unit": req.get("unit", "kg"),
                        "unit_price": 45.0,
                        "bulk_discount": False,
                        "cost_inr": cost
                    })
                    total_order_inr += cost

            total_order_inr = round(total_order_inr, 2)
            po_id = f"PO-SEM1-WK{week}-{len(self.orders_history) + 1:03d}"

            is_budget_breached = total_order_inr > self.weekly_budget_cap
            breach_amount = round(total_order_inr - self.weekly_budget_cap, 2) if is_budget_breached else 0.0

            order_record = {
                "po_id": po_id,
                "week_number": week,
                "requested_by": requested_by,
                "total_order_inr": total_order_inr,
                "weekly_budget_cap": self.weekly_budget_cap,
                "budget_breached": is_budget_breached,
                "breach_amount_inr": breach_amount,
                "status": "REQUIRES_COMMITTEE_APPROVAL" if is_budget_breached else "CONFIRMED_PLACED",
                "line_items": order_line_items,
                "notes": notes
            }
            self.orders_history.append(order_record)
            return order_record

        else:
            return {"error": f"Unknown tool: {name}"}

    def read_resource(self, uri: str) -> Dict[str, Any]:
        if uri == "mess://vendor-prices":
            return {
                "uri": uri,
                "mimeType": "application/json",
                "contents": self.vendor_prices,
                "count": len(self.vendor_prices)
            }
        elif uri == "mess://inventory":
            return {
                "uri": uri,
                "mimeType": "application/json",
                "contents": self.inventory,
                "count": len(self.inventory)
            }
        else:
            return {"error": f"Resource not found: {uri}"}

    def process_rpc(self, request_str: str) -> str:
        try:
            req = json.loads(request_str) if isinstance(request_str, str) else request_str
            method = req.get("method")
            req_id = req.get("id", 1)

            if method == "initialize":
                res = {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {"listChanged": False},
                        "resources": {"subscribe": False, "listChanged": False}
                    },
                    "serverInfo": {
                        "name": "hostel-mess-mcp-server",
                        "version": "1.0.0",
                        "description": "Model Context Protocol Server for wholesale pricing and mess inventory"
                    }
                }
            elif method == "ping":
                res = {}
            elif method == "tools/list":
                res = {"tools": self.list_tools()}
            elif method == "resources/list":
                res = {"resources": self.list_resources()}
            elif method == "resources/read":
                params = req.get("params", {})
                uri = params.get("uri", "")
                res = self.read_resource(uri)
            elif method == "tools/call":
                params = req.get("params", {})
                tool_name = params.get("name")
                args = params.get("arguments", {})
                res = self.handle_tool_call(tool_name, args)
            else:
                return json.dumps({"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": f"Method {method} not found"}})

            return json.dumps({"jsonrpc": "2.0", "id": req_id, "result": res})
        except Exception as e:
            return json.dumps({"jsonrpc": "2.0", "id": None, "error": {"code": -32603, "message": str(e)}})

if __name__ == "__main__":
    server = MessMCPServer()
    print("MCP Server initialized.")
    print("Listing tools:")
    print(json.dumps(server.list_tools(), indent=2))
    print("\nTesting mock ordering API with breach check:")
    test_order = server.handle_tool_call("mock_ordering_api", {
        "items": [
            {"item": "Atta (Whole Wheat Flour)", "quantity": 300},
            {"item": "Fresh Malai Paneer", "quantity": 120},
            {"item": "Broiler Chicken (Curry Cut)", "quantity": 180}
        ],
        "week_number": 6,
        "requested_by": "Menu-Coordinator",
        "notes": "Mid-semester festive dinner and routine staples"
    })
    print(json.dumps(test_order, indent=2))
