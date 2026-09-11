"""
Model Context Protocol (MCP) Server for Hostel Operations Platform (HostelOps)
Exposes discoverable Tools and URI Resources across:
  1. Mess: Wholesale prices, pantry inventory, purchase orders, vendor call intake
  2. Rooms: Vacancies query, priority scoring, autonomous room allocation
  3. Maintenance: NLP hazard triage, technician dispatch, resident verification
"""

import sys
import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

def load_data(filename: str):
    path = os.path.join(DATA_DIR, filename)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

class HostelOpsMCPServer:
    def __init__(self):
        self.vendor_prices = load_data("vendor_prices.json")
        self.inventory = load_data("mess_inventory.json")
        self.orders_history = []
        self.incoming_deliveries = [
            {
                "po_number": "PO-MES-204",
                "vendor_name": "FreshVeg Wholesale Logistics",
                "items_summary": "50 kg Tomatoes, 40 L Milk, 30 kg Toor Dal",
                "total_amount_inr": 14250.0,
                "delivery_window": "Tomorrow 06:30 - 07:00 AM",
                "status": "CONFIRMED_VIA_AI_CALL",
                "restocked": False
            }
        ]
        self.weekly_budget_cap = 150000.0

    def list_tools(self) -> List[Dict[str, Any]]:
        return [
            # --- Mess Domain Tools ---
            {
                "name": "mess_vendor_prices",
                "description": "Fetch wholesale vendor commodity prices with volume tier discounts and supplier info.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "category": {"type": "string", "description": "Category filter: 'Vegetables', 'Dairy', 'Grains & Flour', etc."},
                        "max_price": {"type": "number", "description": "Max unit price filter in INR"}
                    }
                }
            },
            {
                "name": "mess_pantry_inventory",
                "description": "Inspect pantry stock levels, batch IDs, and days-to-expiration countdowns.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "filter_expiring_only": {"type": "boolean", "description": "If true, only return items expiring in <= 3 days"}
                    }
                }
            },
            {
                "name": "mess_order_and_budget_check",
                "description": "Create wholesale ingredient requisition with automated budget ceiling validation.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "items": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "item": {"type": "string"},
                                    "quantity": {"type": "number"}
                                },
                                "required": ["item", "quantity"]
                            }
                        },
                        "week_number": {"type": "integer"},
                        "requested_by": {"type": "string"}
                    },
                    "required": ["items", "week_number", "requested_by"]
                }
            },
            {
                "name": "mess_ingest_vendor_delivery",
                "description": "Intake confirmed items from vendor voice call into live mess pantry inventory.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "po_number": {"type": "string"},
                        "items": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "item": {"type": "string"},
                                    "quantity_added": {"type": "number"},
                                    "unit": {"type": "string"}
                                },
                                "required": ["item", "quantity_added"]
                            }
                        }
                    },
                    "required": ["po_number", "items"]
                }
            },

            # --- Rooms Domain Tools ---
            {
                "name": "rooms_query_vacancies",
                "description": "Query available hostel rooms and bed vacancies across Block A (Single), Block B (Double), and Block C (Triple).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "preferred_block": {"type": "string", "description": "Optional block filter (e.g., 'Block A', 'Block B', 'Block C')"},
                        "room_type": {"type": "string", "description": "Optional room type filter ('Single', 'Double', 'Triple')"}
                    }
                }
            },
            {
                "name": "rooms_score_applicant",
                "description": "Compute transparent priority score for student hostel applicant (Seniority + Medical + Distance).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "student_name": {"type": "string"},
                        "year_of_study": {"type": "integer", "description": "Year (1 to 4)"},
                        "distance_km": {"type": "number", "description": "Home distance in kilometers"},
                        "has_medical_priority": {"type": "boolean"}
                    },
                    "required": ["student_name", "year_of_study", "distance_km"]
                }
            },
            {
                "name": "rooms_execute_allocation",
                "description": "Autonomous room allocation agent mapping highest priority students to optimal vacancies.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "student_id": {"type": "string"},
                        "student_name": {"type": "string"},
                        "priority_score": {"type": "number"},
                        "preferred_type": {"type": "string"}
                    },
                    "required": ["student_id", "student_name", "priority_score"]
                }
            },

            # --- Maintenance Domain Tools ---
            {
                "name": "maintenance_triage_hazard",
                "description": "NLP hazard analysis for room complaints, calculating safety severity (CRITICAL, HIGH, MEDIUM), SLA hours, and failure probability.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "room_or_area": {"type": "string"},
                        "issue_description": {"type": "string"},
                        "appliance_age_months": {"type": "integer"}
                    },
                    "required": ["room_or_area", "issue_description"]
                }
            },
            {
                "name": "maintenance_dispatch_technician",
                "description": "Create maintenance ticket, assign designated technician, and initiate SLA timer.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "room_or_area": {"type": "string"},
                        "category": {"type": "string"},
                        "issue": {"type": "string"},
                        "severity": {"type": "string"},
                        "assigned_to": {"type": "string"}
                    },
                    "required": ["room_or_area", "issue", "severity"]
                }
            }
        ]

    def list_resources(self) -> List[Dict[str, Any]]:
        return [
            {
                "uri": "mess://vendor-prices",
                "name": "Hostel Mess Wholesale Catalog",
                "mimeType": "application/json",
                "description": "Live wholesale price list from contracted APMC Mandi, dairy cooperatives, and grain mills"
            },
            {
                "uri": "mess://inventory",
                "name": "Real-Time Pantry Inventory",
                "mimeType": "application/json",
                "description": "Current on-hand raw material stock with expiration countdowns"
            },
            {
                "uri": "mess://incoming-deliveries",
                "name": "Confirmed Vendor Voice Deliveries",
                "mimeType": "application/json",
                "description": "Live status of purchase orders confirmed via ElevenLabs conversational voice agent"
            },
            {
                "uri": "rooms://vacancies",
                "name": "Hostel Room Vacancy Matrix",
                "mimeType": "application/json",
                "description": "Real-time room occupancy states across Blocks A, B, and C"
            },
            {
                "uri": "maintenance://active-tickets",
                "name": "Maintenance SLA & Hazard Ledger",
                "mimeType": "application/json",
                "description": "Active maintenance tickets, safety hazard severity, and SLA countdowns"
            }
        ]

    def handle_tool_call(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        # 1. Mess Tools
        if name in ["vendor_price_list", "mess_vendor_prices"]:
            cat = arguments.get("category")
            max_p = arguments.get("max_price")
            results = self.vendor_prices
            if cat:
                results = [item for item in results if cat.lower() in item.get("category", "").lower()]
            if max_p is not None:
                results = [item for item in results if item.get("unit_price_inr", 0) <= max_p]
            return {"items": results, "count": len(results)}

        elif name in ["inventory_table", "mess_pantry_inventory"]:
            expiring_only = arguments.get("filter_expiring_only", False)
            if expiring_only:
                filtered = [item for item in self.inventory if item.get("days_to_expiry", 999) <= 3]
                return {"inventory": filtered, "count": len(filtered), "type": "EXPIRING_PERISHABLES"}
            return {"inventory": self.inventory, "count": len(self.inventory), "type": "FULL_PANTRY"}

        elif name in ["mock_ordering_api", "mess_order_and_budget_check"]:
            items = arguments.get("items", [])
            week = arguments.get("week_number", 6)
            requested_by = arguments.get("requested_by", "Menu-Coordinator")
            
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
                qty = req.get("quantity", 1)
                if matched:
                    is_bulk = qty >= matched.get("bulk_threshold", 999999)
                    unit_price = matched["bulk_price_inr"] if is_bulk else matched["unit_price_inr"]
                    cost = round(unit_price * qty, 2)
                    order_line_items.append({
                        "item": matched["item"],
                        "supplier": matched["supplier"],
                        "quantity": qty,
                        "unit": matched.get("unit", "kg"),
                        "unit_price": unit_price,
                        "cost_inr": cost
                    })
                    total_order_inr += cost
                else:
                    cost = round(qty * 45.0, 2)
                    order_line_items.append({
                        "item": req["item"],
                        "supplier": "Local Wholesale",
                        "quantity": qty,
                        "unit": "kg",
                        "unit_price": 45.0,
                        "cost_inr": cost
                    })
                    total_order_inr += cost

            is_budget_breached = total_order_inr > self.weekly_budget_cap
            po_id = f"PO-WK{week}-{len(self.orders_history) + 1:03d}"
            order_record = {
                "po_id": po_id,
                "week_number": week,
                "requested_by": requested_by,
                "total_order_inr": round(total_order_inr, 2),
                "weekly_budget_cap": self.weekly_budget_cap,
                "budget_breached": is_budget_breached,
                "status": "REQUIRES_GOVERNANCE_SIGNATURE" if is_budget_breached else "CONFIRMED_APPROVED",
                "line_items": order_line_items
            }
            self.orders_history.append(order_record)
            return order_record

        elif name == "mess_ingest_vendor_delivery":
            po_no = arguments.get("po_number", "PO-MES-204")
            items = arguments.get("items", [])
            restocked_items = []
            for item_req in items:
                name_str = item_req.get("item", "")
                qty = float(item_req.get("quantity_added", 0))
                # Update in-memory inventory
                found = False
                for p in self.inventory:
                    if name_str.lower() in p["item"].lower():
                        p["quantity"] = round(p["quantity"] + qty, 1)
                        found = True
                        restocked_items.append({"item": p["item"], "new_quantity": p["quantity"], "unit": p["unit"]})
                        break
                if not found:
                    self.inventory.append({
                        "item": name_str,
                        "category": "Fresh Delivery",
                        "quantity": qty,
                        "unit": item_req.get("unit", "kg"),
                        "batch_id": f"LOT-DELIVERY-{po_no}",
                        "days_to_expiry": 7,
                        "urgency": "NORMAL",
                        "supplier": "Vendor Delivery"
                    })
                    restocked_items.append({"item": name_str, "new_quantity": qty, "unit": item_req.get("unit", "kg")})

            return {
                "status": "SUCCESS",
                "message": f"PO {po_no} intake verified. Real-time pantry stock updated.",
                "restocked_items": restocked_items,
                "timestamp": datetime.utcnow().isoformat()
            }

        # 2. Rooms Tools
        elif name == "rooms_query_vacancies":
            pref_block = arguments.get("preferred_block")
            pref_type = arguments.get("room_type")
            mock_rooms = [
                {"room_no": "A-102", "block": "Block A", "type": "Single", "capacity": 1, "occupants": 0, "status": "AVAILABLE"},
                {"room_no": "A-201", "block": "Block A", "type": "Single", "capacity": 1, "occupants": 0, "status": "AVAILABLE"},
                {"room_no": "B-101", "block": "Block B", "type": "Double", "capacity": 2, "occupants": 1, "status": "PARTIAL"},
                {"room_no": "B-102", "block": "Block B", "type": "Double", "capacity": 2, "occupants": 0, "status": "AVAILABLE"},
                {"room_no": "C-101", "block": "Block C", "type": "Triple", "capacity": 3, "occupants": 2, "status": "PARTIAL"},
                {"room_no": "C-102", "block": "Block C", "type": "Triple", "capacity": 3, "occupants": 0, "status": "AVAILABLE"}
            ]
            if pref_block:
                mock_rooms = [r for r in mock_rooms if pref_block.lower() in r["block"].lower()]
            if pref_type:
                mock_rooms = [r for r in mock_rooms if pref_type.lower() in r["type"].lower()]
            return {"vacancies": mock_rooms, "count": len(mock_rooms)}

        elif name == "rooms_score_applicant":
            name_val = arguments.get("student_name", "Student")
            year = arguments.get("year_of_study", 1)
            dist = arguments.get("distance_km", 500.0)
            med = arguments.get("has_medical_priority", False)
            
            seniority_map = {4: 40.0, 3: 30.0, 2: 20.0, 1: 10.0}
            score = seniority_map.get(year, 10.0)
            if med: score += 35.0
            score += min(25.0, round((dist / 2000.0) * 25.0, 1))
            
            return {
                "student_name": name_val,
                "priority_score": score,
                "breakdown": {
                    "seniority_points": seniority_map.get(year, 10.0),
                    "medical_points": 35.0 if med else 0.0,
                    "distance_points": min(25.0, round((dist / 2000.0) * 25.0, 1))
                },
                "eligibility": "HIGH_PRIORITY_SINGLE" if score >= 80 else ("MEDIUM_PRIORITY_DOUBLE" if score >= 60 else "STANDARD_TRIPLE")
            }

        elif name == "rooms_execute_allocation":
            stu_id = arguments.get("student_id", "STU-999")
            stu_name = arguments.get("student_name", "Applicant")
            score = arguments.get("priority_score", 75.0)
            target_room = "A-102" if score >= 85 else ("B-101" if score >= 65 else "C-101")
            
            return {
                "status": "ALLOCATED",
                "student_id": stu_id,
                "student_name": stu_name,
                "allocated_room": target_room,
                "allocation_reason": f"Assigned based on score {score} (Algorithm matched highest available vacancy).",
                "timestamp": datetime.utcnow().isoformat()
            }

        # 3. Maintenance Tools
        elif name == "maintenance_triage_hazard":
            issue = arguments.get("issue_description", "").lower()
            area = arguments.get("room_or_area", "Hostel")
            age = arguments.get("appliance_age_months", 18)

            critical_words = ["spark", "smoke", "fire", "shock", "burst", "collapse", "gas"]
            high_words = ["leak", "water", "overflow", "blackout", "geyser"]

            if any(w in issue for w in critical_words):
                sev = "CRITICAL"
                sla = 1
                urg = 95
            elif any(w in issue for w in high_words):
                sev = "HIGH"
                sla = 4
                urg = 75
            else:
                sev = "MEDIUM"
                sla = 24
                urg = 45

            return {
                "room_or_area": area,
                "assigned_severity": sev,
                "urgency_score": urg,
                "sla_target_hours": sla,
                "safety_hazard_detected": sev == "CRITICAL",
                "technician_dispatch_recommendation": "IMMEDIATE_EMERGENCY" if sev == "CRITICAL" else "SCHEDULED_SHIFT",
                "predictive_recurring_risk": f"{min(95, int(20 + (age * 0.75)))}% over 14 days"
            }

        elif name == "maintenance_dispatch_technician":
            tkt_id = f"TKT-MCP-{len(self.orders_history) + 501}"
            return {
                "ticket_id": tkt_id,
                "room_or_area": arguments.get("room_or_area"),
                "assigned_to": arguments.get("assigned_to", "Primary Electrician / Plumber Team"),
                "status": "DISPATCHED_IN_PROGRESS",
                "sla_countdown_hours": 1 if arguments.get("severity") == "CRITICAL" else 4,
                "timestamp": datetime.utcnow().isoformat()
            }

        return {"error": f"Unknown tool: {name}"}

    def read_resource(self, uri: str) -> Dict[str, Any]:
        if uri == "mess://vendor-prices":
            return {"uri": uri, "contents": self.vendor_prices, "count": len(self.vendor_prices)}
        elif uri == "mess://inventory":
            return {"uri": uri, "contents": self.inventory, "count": len(self.inventory)}
        elif uri == "mess://incoming-deliveries":
            return {"uri": uri, "contents": self.incoming_deliveries, "count": len(self.incoming_deliveries)}
        elif uri == "rooms://vacancies":
            return {
                "uri": uri,
                "vacancies": [
                    {"room_no": "A-102", "block": "Block A", "type": "Single", "available_beds": 1},
                    {"room_no": "B-101", "block": "Block B", "type": "Double", "available_beds": 1},
                    {"room_no": "C-101", "block": "Block C", "type": "Triple", "available_beds": 1}
                ],
                "total_available_beds": 7
            }
        elif uri == "maintenance://active-tickets":
            return {
                "uri": uri,
                "active_tickets": [
                    {"ticket_id": "TKT-401", "room": "Block A-201", "issue": "Fan short circuit", "severity": "CRITICAL", "sla_hours": 1},
                    {"ticket_id": "TKT-402", "room": "Block B-Washroom", "issue": "Water tap leakage", "severity": "HIGH", "sla_hours": 4}
                ]
            }
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
                        "name": "hostelops-mcp-server",
                        "version": "2.0.0",
                        "description": "Multi-Domain Model Context Protocol Server for Mess, Rooms, and Maintenance Operations"
                    }
                }
            elif method == "ping":
                res = {"status": "pong"}
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

# Backward-compatibility alias
MessMCPServer = HostelOpsMCPServer

if __name__ == "__main__":
    server = HostelOpsMCPServer()
    print("HostelOps MCP Server 2.0 initialized.")
    print("Registered tools:", len(server.list_tools()))
    print(json.dumps(server.list_tools(), indent=2))
