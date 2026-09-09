"""
Database persistence layer with SQLAlchemy and PostgreSQL.
Handles tables for Pantry Inventory, Vendor Prices, Weekly Plans, Swarm Debates, and Governance Hash Ledger.
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

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

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

class WeeklyMenuPlan(Base):
    __tablename__ = "weekly_menu_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    week_number = Column(Integer, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    is_breach = Column(Boolean, default=False)
    total_weekly_cost_inr = Column(Float, nullable=False)
    weekly_budget_cap_inr = Column(Float, default=577500.0)
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

def seed_db_if_empty(reset: bool = False):
    """Seed initial data from data/ directory into PostgreSQL."""
    init_db(reset=reset)
    db = SessionLocal()
    try:
        # Seed inventory
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

        # Seed vendor prices
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
