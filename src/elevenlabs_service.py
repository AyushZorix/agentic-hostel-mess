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

def _get_maintenance_agent_id(override: Optional[str] = None) -> str:
    agent = (override or os.getenv("ELEVENLABS_MAINTENANCE_AGENT_ID", "")).strip()
    if not agent or agent == "agent_maintenance_placeholder":
        # Fall back to general agent ID if dedicated maintenance agent isn't set yet
        agent = _get_agent_id()
    return agent

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


async def initiate_maintenance_manager_call(
    manager_phone: Optional[str] = None,
    manager_name: str = "Arjun",
    hostel_name: str = "Aryabhatta Hostel",
    floor: str = "2nd Floor - East Wing Corridor",
    time_captured: str = "03:00 PM",
    corridor_image: Optional[str] = None,
    room_or_area: str = "Block A - Room 204",
    issue_type: str = "Cleaner Not Visible / Cleaning Shift Missed",
    time_slots_missing: Optional[List[str]] = None,
    all_slots_data: Optional[List[Dict[str, Any]]] = None,
    agent_id_override: Optional[str] = None,
    phone_number_id_override: Optional[str] = None,
    api_key_override: Optional[str] = None,
    extra_details: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Triggers an outbound phone call via ElevenLabs Conversational Voice Agent
    to Facility Manager Arjun when a cleaner/washer is not detected in the CCTV corridor images.
    Sends complete data for all 4 fixed-time CCTV images so the agent can answer
    questions about ANY time slot (08:00 AM, 11:30 AM, 03:00 PM, 06:30 PM).
    """
    api_key = _get_api_key(api_key_override)
    agent_id = _get_maintenance_agent_id(agent_id_override)
    phone_number_id = _get_phone_number_id(phone_number_id_override)

    target_phone = manager_phone or os.getenv("MAINTENANCE_MANAGER_PHONE", "+918431362088")
    normalized_phone = _normalize_phone(target_phone)
    missing_str = ", ".join(time_slots_missing) if time_slots_missing else time_captured

    img_val = str(corridor_image or "CCTV_CORRIDOR_CAM_204_0300PM.jpg")
    if len(img_val) > 250 and img_val.startswith("data:"):
        # Truncate raw base64 for cleaner agent payload
        img_val = f"CCTV_CAPTURE_{time_captured.replace(' ', '_')}_{floor.replace(' ', '_')}.jpg"

    # Build detailed slot-by-slot summaries for all images
    slot_variables: Dict[str, Any] = {}
    summary_lines = []
    
    if all_slots_data:
        for idx, s in enumerate(all_slots_data, 1):
            slot_t = s.get("slot_time", f"Slot {idx}")
            slot_lbl = s.get("slot_label", "")
            is_present = s.get("cleaner_present", False)
            staff_name = s.get("cleaner_name") or ("Washer/Cleaner" if is_present else "None")
            status_text = "CLEANER_PRESENT" if is_present else "CLEANER_ABSENT"
            confidence = s.get("confidence_score", 0.95)
            features = ", ".join(s.get("detected_features", []))
            notes = s.get("notes", "")
            
            # Generic slot_1, slot_2, slot_3, slot_4 variables
            slot_variables[f"slot_{idx}_time"] = slot_t
            slot_variables[f"slot_{idx}_label"] = slot_lbl
            slot_variables[f"slot_{idx}_status"] = status_text
            slot_variables[f"slot_{idx}_cleaner_present"] = str(is_present)
            slot_variables[f"slot_{idx}_staff"] = staff_name
            slot_variables[f"slot_{idx}_features"] = features
            slot_variables[f"slot_{idx}_details"] = f"{slot_t} - {slot_lbl}: {'Cleaner PRESENT' if is_present else 'Cleaner ABSENT'} (Detected: {features})"

            # Explicit time-keyed variables so the agent can look up by time directly
            time_key = slot_t.lower().replace(":", "").replace(" ", "_") # e.g. "0800_am", "1130_am"
            slot_variables[f"time_{time_key}_status"] = status_text
            slot_variables[f"time_{time_key}_summary"] = f"{'Present' if is_present else 'ABSENT'} - {features}"

            symbol = "✅ Present" if is_present else "🚨 ABSENT"
            summary_lines.append(f"[{slot_t} {slot_lbl}]: {symbol} ({staff_name} - {features})")

    slots_summary_text = " | ".join(summary_lines) if summary_lines else f"Missed: {missing_str}"
    full_breakdown_text = "; ".join(summary_lines) if summary_lines else missing_str

    dynamic_variables = {
        # Core 4 variables requested
        "hostel_name": hostel_name or "Aryabhatta Hostel",
        "floor": floor or "2nd Floor - East Wing Corridor",
        "time": time_captured or "03:00 PM",
        "corridor_image": img_val,
        # Full multi-slot context so agent knows what happened at ALL times of the day
        "all_slots_summary": slots_summary_text,
        "all_slots_breakdown": full_breakdown_text,
        "missed_time_slots": missing_str,
        "manager_name": manager_name or os.getenv("MAINTENANCE_MANAGER_NAME", "Arjun"),
        "room_number": room_or_area,
        "incident_type": issue_type,
        "urgency": "HIGH",
        "details": extra_details or (
            f"CCTV camera inspection for {hostel_name} on {floor}. "
            f"Alert at {time_captured}: No cleaner visible. "
            f"Full day CCTV inspection record: {full_breakdown_text}."
        ),
        "safeguard_instructions": (
            f"You are calling Facility Manager {manager_name} regarding {hostel_name}, {floor}. "
            f"Primary Alert: At {time_captured}, CCTV showed cleaner was absent. "
            f"If Manager {manager_name} asks about any other time slot during the day, provide the exact status from the CCTV log: {full_breakdown_text}."
        ),
        **slot_variables
    }

    if not api_key:
        logger.warning("[11L-Maint] No ELEVENLABS_API_KEY set. Simulating maintenance call to Arjun.")
        simulated_call_sid = f"CA_MAINT_SIM_{int(datetime.utcnow().timestamp())}"
        simulated_convo_id = f"conv_maint_{int(datetime.utcnow().timestamp())}"

        return {
            "mode": "SIMULATION",
            "success": True,
            "conversation_id": simulated_convo_id,
            "call_sid": simulated_call_sid,
            "to_number": normalized_phone,
            "manager_name": manager_name,
            "room_or_area": room_or_area,
            "dynamic_variables": dynamic_variables,
            "script_preview": (
                f"Hello {manager_name}, this is HostelOps Facility AI calling with an urgent housekeeping alert. "
                f"For {room_or_area}, daily camera inspection detected that no cleaner was visible during: {missing_str}. "
                f"The room has not been marked cleaned. Please dispatch a replacement cleaner immediately."
            ),
            "timestamp": datetime.utcnow().isoformat()
        }

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
        "[11L-Maint][outbound_call] to=%s manager=%s room=%s agent_id=%s phone_id=%s",
        _mask_phone(normalized_phone),
        manager_name,
        room_or_area,
        agent_id,
        phone_number_id
    )

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, json=_json_safe(payload), headers=headers)

    logger.info("[11L-Maint][response] status=%s body=%s", resp.status_code, resp.text)

    if resp.status_code >= 400:
        logger.error("ElevenLabs Maintenance API error %s: %s", resp.status_code, resp.text)
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
        "manager_name": manager_name,
        "room_or_area": room_or_area,
        "dynamic_variables": dynamic_variables,
        "timestamp": datetime.utcnow().isoformat()
    }


async def initiate_student_room_allotment_call(
    student_name: str,
    phone_number: str,
    student_id: str,
    room_no: str,
    block: str,
    room_type: str = "Double",
    floor: int = 1,
    priority_score: float = 0.0,
    api_key_override: Optional[str] = None,
    agent_id_override: Optional[str] = None,
    phone_number_id_override: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Dispatches an automated outbound voice call via ElevenLabs Conversational AI + Twilio
    to inform a student that their room allotment is completed and announce their allotted room.
    """
    api_key = _get_api_key(api_key_override)
    agent_id = _get_agent_id(agent_id_override)
    phone_number_id = _get_phone_number_id(phone_number_id_override)

    normalized_phone = _normalize_phone(phone_number)
    if not normalized_phone:
        normalized_phone = os.getenv("MAINTENANCE_MANAGER_PHONE", "+918431362088")

    dynamic_variables = {
        "student_name": student_name,
        "student_id": student_id,
        "room_no": room_no,
        "room_number": room_no,
        "block": block,
        "room_type": room_type,
        "floor": str(floor),
        "priority_score": str(priority_score),
        "manager_name": student_name,
        "details": (
            f"Official HostelOps Room Allotment Notification: Congratulations {student_name} (ID: {student_id})! "
            f"Your hostel room application has been successfully processed and approved. "
            f"You have been officially allotted Room {room_no} in {block} (Type: {room_type}, Floor {floor}). "
            f"Please visit the Hostel Warden Office with your student ID card to collect your room keys."
        ),
        "safeguard_instructions": (
            f"You are the official University Hostel Administration AI voice assistant calling student {student_name} "
            f"(Student ID: {student_id}). "
            f"Your mission is to warmly inform them that their hostel room allotment is complete! "
            f"They have been allocated Room Number {room_no} in {block}. "
            f"It is a {room_type} room located on Floor {floor}. "
            f"Inform them they can collect their room keys from the Warden Office between 9 AM and 5 PM on weekdays. "
            f"Answer any questions they have regarding the room, block, or check-in procedure politely and clearly."
        )
    }

    if not api_key:
        logger.warning("[11L-Room] No ELEVENLABS_API_KEY set. Simulating allotment call.")
        simulated_call_sid = f"CA_ROOM_SIM_{int(datetime.utcnow().timestamp())}"
        simulated_convo_id = f"conv_room_{int(datetime.utcnow().timestamp())}"
        return {
            "mode": "SIMULATION",
            "success": True,
            "conversation_id": simulated_convo_id,
            "call_sid": simulated_call_sid,
            "to_number": normalized_phone,
            "student_name": student_name,
            "room_no": room_no,
            "block": block,
            "dynamic_variables": dynamic_variables,
            "script_preview": (
                f"Hello {student_name}! This is the Hostel Administration Voice Assistant calling to confirm that your "
                f"hostel room allotment is complete. You have been allotted Room {room_no} in {block} ({room_type} sharing, Floor {floor}). "
                f"Please collect your room keys from the Warden Office."
            ),
            "timestamp": datetime.utcnow().isoformat()
        }

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
        "[11L-Room][outbound_call] to=%s student=%s room=%s agent_id=%s phone_id=%s",
        _mask_phone(normalized_phone),
        student_name,
        room_no,
        agent_id,
        phone_number_id
    )

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, json=_json_safe(payload), headers=headers)

        logger.info("[11L-Room][response] status=%s body=%s", resp.status_code, resp.text)

        if resp.status_code >= 400:
            logger.error("ElevenLabs Room Allotment API error %s: %s", resp.status_code, resp.text)
            return {
                "mode": "FAILED_API",
                "success": False,
                "error": f"ElevenLabs API error {resp.status_code}: {resp.text}",
                "to_number": normalized_phone,
                "student_name": student_name,
                "room_no": room_no,
                "block": block,
                "timestamp": datetime.utcnow().isoformat()
            }

        data = resp.json()
        if data.get("success") is False:
            err_msg = data.get("message", "Unknown Twilio / ElevenLabs error")
            logger.error(f"[11L-Room] Dispatch error: {err_msg}")
            return {
                "mode": "FAILED_TWILIO",
                "success": False,
                "error": err_msg,
                "to_number": normalized_phone,
                "student_name": student_name,
                "room_no": room_no,
                "block": block,
                "timestamp": datetime.utcnow().isoformat()
            }

        return {
            "mode": "LIVE",
            "success": True,
            "conversation_id": data.get("conversation_id"),
            "call_sid": data.get("callSid") or data.get("call_sid"),
            "to_number": normalized_phone,
            "student_name": student_name,
            "room_no": room_no,
            "block": block,
            "dynamic_variables": dynamic_variables,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"[11L-Room] Call dispatch exception: {e}")
        return {
            "mode": "EXCEPTION",
            "success": False,
            "error": str(e),
            "to_number": normalized_phone,
            "student_name": student_name,
            "room_no": room_no,
            "block": block,
            "timestamp": datetime.utcnow().isoformat()
        }

