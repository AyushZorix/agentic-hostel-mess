"""
Database persistence layer with SQLAlchemy and PostgreSQL.
Handles tables for:
  1. Mess: Pantry Inventory, Vendor Prices, Vendors List, Call Logs, Weekly Plans, Audit Ledger
  2. Rooms: Hostel Rooms, Student Room Applications
  3. Maintenance: Maintenance Tickets, SLA Logs
"""

import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean, JSON, DateTime, Text
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgrespassword@localhost:5432/hostel_mess")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ==========================================
# 1. Mess & Vendor Domain Models
# ==========================================

class PantryInventory(Base):
    __tablename__ = "pantry_inventory"
    
    id = Column(Integer, primary_key=True, index=True)
    item = Column(String(255), nullable=False, unique=True)
    category = Column(String(100), default="General")
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    batch_id = Column(String(100), nullable=False)
    days_to_expiry = Column(Integer, nullable=False)
    reorder_point = Column(Float, default=10.0)
    urgency = Column(String(100), default="NORMAL")
    unit_cost_inr = Column(Float, default=0.0)
    supplier = Column(String(255), default="APMC Wholesale")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class VendorPrice(Base):
    __tablename__ = "vendor_prices"
    
    id = Column(Integer, primary_key=True, index=True)
    item = Column(String(255), nullable=False, unique=True)
    category = Column(String(100), default="General")
    unit = Column(String(50), nullable=False)
    unit_price_inr = Column(Float, nullable=False)
    bulk_price_inr = Column(Float, nullable=False)
    bulk_threshold = Column(Float, nullable=False)
    supplier = Column(String(255), nullable=False)
    shelf_life_days = Column(Integer, default=30)
    lead_time_days = Column(Integer, default=1)

class HostelVendor(Base):
    __tablename__ = "hostel_vendors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    phone = Column(String(50), nullable=False)
    category = Column(String(100), default="Vegetables & Groceries")
    contact_person = Column(String(255), default="Wholesale Dispatch Manager")
    default_delivery_window = Column(String(100), default="Tomorrow 06:30 - 07:00 AM")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class VendorCallLog(Base):
    __tablename__ = "vendor_call_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String(100), nullable=False, index=True)
    vendor_name = Column(String(255), nullable=False)
    phone_called = Column(String(50), nullable=False)
    items_summary = Column(Text, nullable=False)
    total_amount_inr = Column(Float, nullable=False)
    delivery_window = Column(String(100), nullable=False)
    call_sid = Column(String(150), nullable=True)
    conversation_id = Column(String(150), nullable=True)
    status = Column(String(50), default="INITIATED") # INITIATED, CONNECTED, COMPLETED, FAILED
    transcript = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

class WeeklyMenuPlan(Base):
    __tablename__ = "weekly_menu_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    week_number = Column(Integer, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    is_breach = Column(Boolean, default=False)
    total_weekly_cost_inr = Column(Float, nullable=False)
    weekly_budget_cap_inr = Column(Float, default=150000.0)
    breach_amount_inr = Column(Float, default=0.0)
    cost_per_student_day_inr = Column(Float, nullable=False)
    average_daily_protein_g = Column(Float, nullable=False)
    average_daily_calories = Column(Float, nullable=False)
    leftovers_cleared_kg = Column(Float, default=0.0)
    status = Column(String(100), default="AUTO_APPROVED")
    approval_id = Column(String(100), nullable=True)
    schedule_data = Column(JSON, nullable=False)
    conflicts_resolved = Column(JSON, default=list)
    procurement_items = Column(JSON, default=list)
    swarm_transcripts = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLedgerEntry(Base):
    __tablename__ = "audit_ledger"
    
    id = Column(Integer, primary_key=True, index=True)
    index = Column(Integer, nullable=False, unique=True)
    timestamp = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    approval_id = Column(String(100), nullable=True)
    payload_json = Column(JSON, nullable=False)
    prev_hash = Column(String(64), nullable=False)
    entry_hash = Column(String(64), nullable=False)
    signatures = Column(JSON, default=dict)
    status = Column(String(100), nullable=False)

# ==========================================
# 2. Room Allocation Domain Models
# ==========================================

class HostelRoom(Base):
    __tablename__ = "hostel_rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    room_no = Column(String(50), nullable=False, unique=True)
    block = Column(String(100), nullable=False)
    floor = Column(Integer, nullable=False)
    type = Column(String(50), nullable=False) # Single, Double, Triple
    capacity = Column(Integer, nullable=False)
    occupants = Column(JSON, default=list)
    status = Column(String(50), default="AVAILABLE") # AVAILABLE, PARTIAL, OCCUPIED
    created_at = Column(DateTime, default=datetime.utcnow)

class StudentRoomApplication(Base):
    __tablename__ = "student_room_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(String(100), nullable=False, unique=True)
    student_id = Column(String(100), nullable=False)
    student_name = Column(String(255), nullable=False)
    year_of_study = Column(Integer, nullable=False)
    distance_km = Column(Float, nullable=False)
    has_medical_priority = Column(Boolean, default=False)
    preferred_type = Column(String(50), default="Double")
    priority_score = Column(Float, default=0.0)
    phone = Column(String(50), nullable=True)
    allocated_room = Column(String(50), nullable=True)
    status = Column(String(50), default="PENDING_ALLOCATION") # PENDING_ALLOCATION, ALLOCATED, REJECTED
    special_notes = Column(Text, default="")
    applied_at = Column(DateTime, default=datetime.utcnow)

# ==========================================
# 3. Maintenance & Care Domain Models
# ==========================================

class MaintenanceTicket(Base):
    __tablename__ = "maintenance_tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String(100), nullable=False, unique=True)
    room_or_area = Column(String(255), nullable=False)
    category = Column(String(100), default="Electrical")
    issue = Column(Text, nullable=False)
    severity = Column(String(50), default="MEDIUM") # CRITICAL, HIGH, MEDIUM, LOW
    urgency_score = Column(Integer, default=50)
    assigned_to = Column(String(255), default="Facilities Team")
    status = Column(String(50), default="OPEN") # OPEN, IN_PROGRESS, RESOLVED
    failure_risk = Column(String(255), default="")
    reported_at = Column(String(100), default="")
    resident_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db(reset: bool = False):
    """Create all tables if they do not exist, optionally dropping old ones."""
    if reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE student_room_applications ADD COLUMN IF NOT EXISTS phone VARCHAR(50);"))
            conn.commit()
    except Exception:
        pass

def seed_db_if_empty(reset: bool = False):
    """Seed initial data across Mess, Rooms, and Maintenance into PostgreSQL."""
    init_db(reset=reset)
    db = SessionLocal()
    try:
        # Seed Vendors
        if db.query(HostelVendor).count() == 0:
            default_vendors = [
                HostelVendor(name="FreshVeg Wholesale Logistics", phone="+919876543210", category="Vegetables & Greens", contact_person="Ramesh Patel", default_delivery_window="Tomorrow 06:30 - 07:00 AM"),
                HostelVendor(name="DairyFresh Milk Producers", phone="+919811122233", category="Milk, Paneer & Curd", contact_person="Suresh Yadav", default_delivery_window="Tomorrow 06:00 - 06:30 AM"),
                HostelVendor(name="Annapurna Grain Mandi", phone="+919833344455", category="Rice, Wheat & Pulses", contact_person="Mukesh Aggarwal", default_delivery_window="Tomorrow 07:00 - 08:00 AM"),
            ]
            for v in default_vendors:
                db.add(v)
            db.commit()
            print("[DB] Seeded 3 default vendors into PostgreSQL.")

        # Seed Rooms
        if db.query(HostelRoom).count() == 0:
            default_rooms = [
                HostelRoom(room_no="A-101", block="Block A (Senior Wing)", floor=1, type="Single", capacity=1, occupants=["STU-401"], status="OCCUPIED"),
                HostelRoom(room_no="A-102", block="Block A (Senior Wing)", floor=1, type="Single", capacity=1, occupants=[], status="AVAILABLE"),
                HostelRoom(room_no="A-201", block="Block A (Senior Wing)", floor=2, type="Single", capacity=1, occupants=[], status="AVAILABLE"),
                HostelRoom(room_no="B-101", block="Block B (Double Sharing)", floor=1, type="Double", capacity=2, occupants=["STU-305"], status="PARTIAL"),
                HostelRoom(room_no="B-102", block="Block B (Double Sharing)", floor=1, type="Double", capacity=2, occupants=[], status="AVAILABLE"),
                HostelRoom(room_no="B-201", block="Block B (Double Sharing)", floor=2, type="Double", capacity=2, occupants=["STU-209", "STU-210"], status="OCCUPIED"),
                HostelRoom(room_no="B-202", block="Block B (Double Sharing)", floor=2, type="Double", capacity=2, occupants=[], status="AVAILABLE"),
                HostelRoom(room_no="C-101", block="Block C (Triple Sharing)", floor=1, type="Triple", capacity=3, occupants=["STU-101", "STU-102"], status="PARTIAL"),
                HostelRoom(room_no="C-102", block="Block C (Triple Sharing)", floor=1, type="Triple", capacity=3, occupants=[], status="AVAILABLE"),
                HostelRoom(room_no="C-201", block="Block C (Triple Sharing)", floor=2, type="Triple", capacity=3, occupants=[], status="AVAILABLE"),
            ]
            for r in default_rooms:
                db.add(r)
            db.commit()
            print("[DB] Seeded 10 hostel rooms into PostgreSQL.")

        # Seed Room Applications
        if db.query(StudentRoomApplication).count() == 0:
            default_apps = [
                StudentRoomApplication(application_id="REQ-101", student_id="STU-402", student_name="Aarav Sharma", year_of_study=4, distance_km=1450.0, has_medical_priority=True, preferred_type="Single", priority_score=98.5, status="PENDING_ALLOCATION"),
                StudentRoomApplication(application_id="REQ-102", student_id="STU-403", student_name="Ananya Iyer", year_of_study=4, distance_km=890.0, has_medical_priority=False, preferred_type="Single", priority_score=85.0, status="PENDING_ALLOCATION"),
                StudentRoomApplication(application_id="REQ-103", student_id="STU-308", student_name="Rohan Verma", year_of_study=3, distance_km=1200.0, has_medical_priority=True, preferred_type="Double", priority_score=92.0, status="PENDING_ALLOCATION"),
                StudentRoomApplication(application_id="REQ-104", student_id="STU-215", student_name="Priya Patel", year_of_study=2, distance_km=650.0, has_medical_priority=False, preferred_type="Double", priority_score=68.0, status="PENDING_ALLOCATION"),
                StudentRoomApplication(application_id="REQ-105", student_id="STU-112", student_name="Devansh Gupta", year_of_study=1, distance_km=1800.0, has_medical_priority=False, preferred_type="Triple", priority_score=72.0, status="PENDING_ALLOCATION"),
            ]
            for a in default_apps:
                db.add(a)
            db.commit()
            print("[DB] Seeded 5 student room applications into PostgreSQL.")

        # Seed Maintenance Tickets
        if db.query(MaintenanceTicket).count() == 0:
            default_tickets = [
                MaintenanceTicket(ticket_id="TKT-401", room_or_area="Block A - Room 201", category="Electrical", issue="Ceiling fan regulator short circuit / sparking risk", severity="CRITICAL", urgency_score=95, assigned_to="Electrician Team A", status="IN_PROGRESS", failure_risk="85% recurrence risk within 14d", reported_at="Today 08:30 AM"),
                MaintenanceTicket(ticket_id="TKT-402", room_or_area="Block B - Ground Floor Washroom", category="Plumbing", issue="Water tap leakage near main riser valve", severity="HIGH", urgency_score=75, assigned_to="Plumber Raman", status="OPEN", failure_risk="60% valve degradation risk", reported_at="Today 09:15 AM"),
                MaintenanceTicket(ticket_id="TKT-403", room_or_area="Mess Kitchen & Dining Area", category="Appliance", issue="Commercial dough mixer motor bearing inspection", severity="MEDIUM", urgency_score=45, assigned_to="Kitchen Tech Support", status="OPEN", failure_risk="35% bearing seizure risk", reported_at="Yesterday 04:00 PM"),
                MaintenanceTicket(ticket_id="TKT-404", room_or_area="Block C - 2nd Floor Corridor", category="Housekeeping", issue="Post-monsoon floor cleaning and disinfection", severity="LOW", urgency_score=20, assigned_to="Housekeeping Shift 2", status="RESOLVED", failure_risk="Routine upkeep", reported_at="Yesterday 11:00 AM", resident_verified=True),
            ]
            for t in default_tickets:
                db.add(t)
            db.commit()
            print("[DB] Seeded 4 maintenance tickets into PostgreSQL.")

        # Seed pantry inventory if empty
        if db.query(PantryInventory).count() == 0:
            inv_file = os.path.join(os.path.dirname(__file__), "..", "data", "mess_inventory.json")
            if os.path.exists(inv_file):
                with open(inv_file, "r") as f:
                    inv_data = json.load(f)
                    for item in inv_data:
                        db.add(PantryInventory(
                            item=item["item"],
                            category=item.get("category", "Perishables" if item.get("days_to_expiry", 99) <= 3 else "Pantry Staples"),
                            quantity=float(item["quantity"]),
                            unit=item["unit"],
                            batch_id=item["batch_id"],
                            days_to_expiry=int(item["days_to_expiry"]),
                            reorder_point=float(item.get("reorder_point", 15.0)),
                            urgency=item.get("urgency", "NORMAL"),
                            unit_cost_inr=float(item.get("unit_cost_inr", 35.0)),
                            supplier=item.get("supplier", "APMC Wholesale Mandi")
                        ))
                db.commit()
                print(f"[DB] Seeded {len(inv_data)} pantry items into PostgreSQL.")

        # Seed vendor prices if empty
        if db.query(VendorPrice).count() == 0:
            vp_file = os.path.join(os.path.dirname(__file__), "..", "data", "vendor_prices.json")
            if os.path.exists(vp_file):
                with open(vp_file, "r") as f:
                    vp_data = json.load(f)
                    for item in vp_data:
                        db.add(VendorPrice(
                            item=item["item"],
                            category=item.get("category", "General"),
                            unit=item["unit"],
                            unit_price_inr=float(item["unit_price_inr"]),
                            bulk_price_inr=float(item["bulk_price_inr"]),
                            bulk_threshold=float(item["bulk_threshold"]),
                            supplier=item["supplier"],
                            shelf_life_days=int(item.get("shelf_life_days", 30)),
                            lead_time_days=int(item.get("lead_time_days", 1))
                        ))
                db.commit()
                print(f"[DB] Seeded {len(vp_data)} vendor price items into PostgreSQL.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db_if_empty(reset=True)
    print("[DB] Database initialized and seeded successfully.")
