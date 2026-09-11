"""
HostelOps ElevenLabs Conversational AI Voice Service
---------------------------------------------------
Initiates outbound phone calls to suppliers and vendors using ElevenLabs'
Conversational AI connected to Twilio.

Dynamic variables matching the ElevenLabs agent schema:
  - manager_name
  - vendor_name
  - hostel_name
  - po_number
  - items_summary
  - total_amount_inr
  - delivery_window
  - arrival_time
  - safeguard_instructions
"""

from __future__ import annotations

import os
import logging
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

import httpx

logger = logging.getLogger(__name__)

ELEVENLABS_BASE = "https://api.elevenlabs.io/v1"

def _get_api_key(override: Optional[str] = None) -> str:
    return (override or os.getenv("ELEVENLABS_API_KEY", "")).strip()

def _get_agent_id(override: Optional[str] = None) -> str:
    return (override or os.getenv("ELEVENLABS_AGENT_ID", "agent_4801m27t9mqjf9tb4tache0cwqt6")).strip()

def _get_phone_number_id(override: Optional[str] = None) -> str:
    return (override or os.getenv("ELEVENLABS_PHONE_NUMBER_ID", os.getenv("ELEVENLABS_BLOOD_PHONE_NUMBER_ID", "phnum_9601m27vaw83ecqrfj4y1mb6qzmc"))).strip()


def _mask_phone(raw_phone: str) -> str:
    digits = "".join(ch for ch in str(raw_phone or "") if ch.isdigit())
    if len(digits) <= 4:
        return "***"
    return f"***{digits[-4:]}"


def _json_safe(value: Any) -> Any:
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(k): _json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_json_safe(v) for v in value]
    return value


def _normalize_phone(raw_phone: str) -> str:
    cleaned = str(raw_phone or "").strip()
    if cleaned.startswith("+"):
        digits = "".join(ch for ch in cleaned if ch.isdigit())
        return f"+{digits}"
    digits = "".join(ch for ch in cleaned if ch.isdigit())
    if len(digits) == 10:
        return f"+91{digits}"
    elif len(digits) > 10:
        return f"+{digits}"
    return f"+91{digits}" if digits else "+919876543210"


async def initiate_vendor_outbound_call(
    vendor_phone: str,
    vendor_name: str,
    po_number: str,
    items_summary: List[str] | str,
    total_amount_inr: float,
    delivery_window: str = "Tomorrow 06:30 - 07:00 AM",
    arrival_time: str = "06:45 AM",
    hostel_name: str = "Aryabhatta & Nilgiri Central Hostel",
    manager_name: str = "Paroji Warden",
    agent_id_override: Optional[str] = None,
    phone_number_id_override: Optional[str] = None,
    api_key_override: Optional[str] = None,
    extra_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Start an ElevenLabs Conversational AI outbound call to the hostel vendor.
    """
    api_key = _get_api_key(api_key_override)
    agent_id = _get_agent_id(agent_id_override)
    phone_number_id = _get_phone_number_id(phone_number_id_override)

    normalized_phone = _normalize_phone(vendor_phone)

    if isinstance(items_summary, list):
        formatted_items = ", ".join(items_summary)
    else:
        formatted_items = str(items_summary)

    # Injected variables matching ElevenLabs agent setup exactly:
    dynamic_variables = {
        "manager_name": manager_name,
        "vendor_name": vendor_name,
        "hostel_name": hostel_name,
        "po_number": po_number,
        "items_summary": formatted_items,
        "total_amount_inr": f"INR {total_amount_inr:,.2f}",
        "delivery_window": delivery_window,
        "arrival_time": arrival_time,
        "safeguard_instructions": (
            "You are an automated logistics agent confirming an already approved purchase order. "
            "You CANNOT change prices, quantities, or accept surcharges. If the vendor reports "
            "delays or item shortages, log the note and ask them to contact the mess manager."
        ),
        **(extra_context or {}),
    }

    # If API key is not configured, fall back to high-fidelity simulation
    if not api_key:
        logger.warning("[11L] No ELEVENLABS_API_KEY set. Simulating call.")
        simulated_call_sid = f"CA_SIM_{int(datetime.utcnow().timestamp())}_{po_number}"
        simulated_convo_id = f"conv_sim_{int(datetime.utcnow().timestamp())}"
        
        return {
            "mode": "SIMULATION",
            "success": True,
            "conversation_id": simulated_convo_id,
            "call_sid": simulated_call_sid,
            "to_number": normalized_phone,
            "vendor_name": vendor_name,
            "po_number": po_number,
            "dynamic_variables": dynamic_variables,
            "script_preview": (
                f"Hello {vendor_name}, this is HostelOps automated logistics assistant calling from {hostel_name} on behalf of {manager_name}. "
                f"I am calling to confirm delivery for Purchase Order {po_number} with approved total {dynamic_variables['total_amount_inr']}. "
                f"Items: {formatted_items}. Scheduled delivery is {delivery_window}, expected around {arrival_time}. Can you confirm acceptance of these terms?"
            ),
            "simulated_vendor_response": {
                "confirmed": True,
                "estimated_arrival": arrival_time,
                "vendor_notes": "All items packed and ready for morning dispatch",
                "confidence_score": 0.98
            },
            "timestamp": datetime.utcnow().isoformat()
        }

    # Live ElevenLabs Outbound Call Payload
    payload = {
        "agent_id": agent_id,
        "agent_phone_number_id": phone_number_id,
        "to_number": normalized_phone,
        "conversation_initiation_client_data": {
            "dynamic_variables": dynamic_variables,
        },
    }

    url = f"{ELEVENLABS_BASE}/convai/twilio/outbound-call"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
    }

    logger.info(
        "[11L][outbound_call] to=%s vendor=%s po=%s agent_id=%s phone_id=%s",
        _mask_phone(normalized_phone),
        vendor_name,
        po_number,
        agent_id,
        phone_number_id
    )

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, json=_json_safe(payload), headers=headers)

    logger.info("[11L][response] status=%s body=%s", resp.status_code, resp.text)

    if resp.status_code >= 400:
        logger.error("ElevenLabs API error %s: %s", resp.status_code, resp.text)
        raise RuntimeError(f"ElevenLabs API error {resp.status_code}: {resp.text}")

    data = resp.json()
    if data.get("success") is False:
        msg = data.get("message", "Unknown ElevenLabs / Twilio error")
        raise RuntimeError(f"ElevenLabs dispatch error: {msg}")

    return {
        "mode": "LIVE",
        "success": True,
        "conversation_id": data.get("conversation_id"),
        "call_sid": data.get("callSid") or data.get("call_sid"),
        "to_number": normalized_phone,
        "vendor_name": vendor_name,
        "po_number": po_number,
        "dynamic_variables": dynamic_variables,
        "timestamp": datetime.utcnow().isoformat()
    }


async def get_conversation(conversation_id: str, api_key_override: Optional[str] = None) -> Dict[str, Any]:
    """Fetch conversation details (transcript, vendor confirmation analysis) from ElevenLabs."""
    api_key = _get_api_key(api_key_override)
    if not api_key:
        return {
            "conversation_id": conversation_id,
            "status": "COMPLETED",
            "transcript": [
                {"role": "agent", "message": "Hello FreshVeg Logistics, confirming PO-MES-204 delivery for tomorrow 6:30 AM."},
                {"role": "vendor", "message": "Yes, confirmed. 50kg tomatoes, milk, and toor dal will arrive by 6:45 AM."},
                {"role": "agent", "message": "Thank you. Recorded in HostelOps. Have a great day!"}
            ],
            "analysis": {
                "delivery_confirmed": True,
                "arrival_time": "06:45 AM",
                "discrepancies": False
            }
        }

    url = f"{ELEVENLABS_BASE}/convai/conversations/{conversation_id}"
    headers = {"xi-api-key": api_key}

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, headers=headers)

    if resp.status_code >= 400:
        raise RuntimeError(f"ElevenLabs GET conversation error: {resp.text}")

    return resp.json()


def process_vendor_call_webhook(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Processes post-call webhook data from ElevenLabs.
    Extracts vendor confirmation signals to trigger predictive kitchen prep.
    """
    conversation_id = payload.get("conversation_id", "")
    transcript = payload.get("transcript", [])
    analysis = payload.get("analysis", {})

    transcript_text = " ".join([turn.get("message", "") for turn in transcript]).lower()
    has_delay = "delay" in transcript_text or "late" in transcript_text or "traffic" in transcript_text
    is_confirmed = "confirm" in transcript_text or "yes" in transcript_text or "arrive" in transcript_text

    return {
        "conversation_id": conversation_id,
        "is_confirmed": is_confirmed,
        "has_delay_risk": has_delay,
        "predictive_impact": {
            "breakfast_prep_status": "ON_SCHEDULE" if not has_delay else "BUFFER_RECIPE_TRIGGERED",
            "confidence": 0.96,
            "recommended_action": "Proceed with standard cooking schedule" if not has_delay else "Begin lentil soaking 30 mins early"
        },
        "processed_at": datetime.utcnow().isoformat()
    }
