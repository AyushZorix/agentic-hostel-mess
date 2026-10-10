/**
 * Frontend API client for FastAPI backend (PostgreSQL + Groq Multi-Agent Swarm)
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8008";

export async function fetchHealth() {
  const res = await fetch(`${API_BASE_URL}/api/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

export async function getLatestMenu() {
  const res = await fetch(`${API_BASE_URL}/api/menu/latest`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch latest menu");
  return res.json();
}

export async function generatePlan(weekNumber: number = 6, forceBreach: boolean = false, customTheme: string = "") {
  const res = await fetch(`${API_BASE_URL}/api/agents/generate-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      week_number: weekNumber,
      force_breach: forceBreach,
      custom_theme: customTheme
    })
  });
  if (!res.ok) throw new Error("Agent plan generation failed");
  return res.json();
}

export async function getPantryInventory(filterExpiring: boolean = false) {
  const res = await fetch(`${API_BASE_URL}/api/inventory?filter_expiring=${filterExpiring}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch inventory");
  return res.json();
}

export async function updatePantryItem(item: string, quantityDelta: number, forceAutoCall: boolean = false) {
  const res = await fetch(`${API_BASE_URL}/api/inventory/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item, quantity_delta: quantityDelta, force_auto_call: forceAutoCall })
  });
  if (!res.ok) throw new Error("Failed to update inventory item");
  return res.json();
}

export async function recordStockLevel(data: {
  item: string;
  quantity: number;
  unit?: string;
  reorder_point?: number;
  supplier?: string;
  force_auto_call?: boolean;
}) {
  const res = await fetch(`${API_BASE_URL}/api/inventory/record`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to record stock level");
  return res.json();
}

export async function recordStockBatch(items: Array<{
  item: string;
  quantity: number;
  unit?: string;
  reorder_point?: number;
  supplier?: string;
  force_auto_call?: boolean;
}>) {
  const res = await fetch(`${API_BASE_URL}/api/inventory/record-batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items })
  });
  if (!res.ok) throw new Error("Failed to record stock batch");
  return res.json();
}

export async function getLowStockStatus() {
  const res = await fetch(`${API_BASE_URL}/api/inventory/low-stock-status`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch low stock status");
  return res.json();
}

export async function configureAutoReorder(data: {
  item: string;
  reorder_point: number;
  supplier: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/inventory/auto-reorder/configure`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to configure auto-reorder rule");
  return res.json();
}

export async function scanAndReorderAll(force: boolean = false) {
  const res = await fetch(`${API_BASE_URL}/api/inventory/scan-and-reorder?force=${force}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) throw new Error("Failed to scan and trigger reorders");
  return res.json();
}

export async function triggerItemCall(itemId: number, force: boolean = true) {
  const res = await fetch(`${API_BASE_URL}/api/inventory/trigger-item-call/${itemId}?force=${force}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) throw new Error("Failed to trigger voice call for item");
  return res.json();
}

export async function getGovernanceStatus() {
  const res = await fetch(`${API_BASE_URL}/api/governance/status`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch governance status");
  return res.json();
}

export async function signGovernanceCase(
  approvalId: string,
  signatoryRole: string,
  signatoryName: string,
  decision: string = "APPROVE",
  comments: string = ""
) {
  const res = await fetch(`${API_BASE_URL}/api/governance/sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      approval_id: approvalId,
      signatory_role: signatoryRole,
      signatory_name: signatoryName,
      decision,
      comments
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to sign approval case");
  }
  return res.json();
}

export async function executeMCPTool(toolName: string, args: Record<string, any> = {}) {
  const res = await fetch(`${API_BASE_URL}/api/mcp/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool_name: toolName, arguments: args })
  });
  if (!res.ok) throw new Error("MCP execution failed");
  return res.json();
}

export async function sendMCPRpc(payload: Record<string, any>) {
  const res = await fetch(`${API_BASE_URL}/api/mcp/rpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("MCP JSON-RPC call failed");
  return res.json();
}

export async function getMCPResources() {
  const res = await fetch(`${API_BASE_URL}/api/mcp/resources`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch MCP resources");
  return res.json();
}

// Room Allocation APIs
export async function getRoomsStatus() {
  const res = await fetch(`${API_BASE_URL}/api/rooms/status`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch room status");
  return res.json();
}

export async function getRoomRequests() {
  const res = await fetch(`${API_BASE_URL}/api/rooms/requests`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch room requests");
  return res.json();
}

export async function createRoomRequest(data: {
  student_id: string;
  student_name: string;
  phone?: string;
  year_of_study: number;
  distance_km: number;
  has_medical_priority: boolean;
  preferred_type: string;
  special_notes?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/rooms/request/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to submit room application");
  return res.json();
}

export async function allocateRooms() {
  const res = await fetch(`${API_BASE_URL}/api/rooms/allocate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) throw new Error("Failed to run room allocation agent");
  return res.json();
}

export async function callStudentForRoomAllotment(applicationId: string, phone?: string) {
  const url = `${API_BASE_URL}/api/rooms/${applicationId}/call-student${phone ? `?phone=${encodeURIComponent(phone)}` : ""}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) throw new Error("Failed to dispatch voice call to student");
  return res.json();
}

// Vendor Voice Call API (Twilio + ElevenLabs Agent)
export async function triggerVendorCall(data?: {
  vendor_name?: string;
  vendor_phone?: string;
  po_number?: string;
  items_summary?: string[];
  total_amount_inr?: number;
  delivery_window?: string;
  elevenlabs_agent_id?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/vendor/call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data || {})
  });
  if (!res.ok) throw new Error("Failed to trigger vendor call");
  return res.json();
}

export async function fetchVendorCallDetails(conversationId: string) {
  const res = await fetch(`${API_BASE_URL}/api/vendor/call/${conversationId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch call details");
  return res.json();
}

// Vendor Management APIs (PostgreSQL)
export async function fetchVendors() {
  const res = await fetch(`${API_BASE_URL}/api/vendors`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch vendors");
  return res.json();
}

export async function createVendor(data: {
  name: string;
  phone: string;
  category?: string;
  contact_person?: string;
  default_delivery_window?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/vendors/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to add vendor");
  return res.json();
}

export async function fetchCallLogs() {
  const res = await fetch(`${API_BASE_URL}/api/vendor/calls/logs`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch call logs");
  return res.json();
}

// Maintenance APIs (PostgreSQL)
export async function fetchMaintenanceTickets() {
  const res = await fetch(`${API_BASE_URL}/api/maintenance/tickets`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch tickets");
  return res.json();
}

export async function createMaintenanceTicket(data: {
  room_or_area: string;
  category?: string;
  issue: string;
  severity?: string;
  assigned_to?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/maintenance/tickets/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to create ticket");
  return res.json();
}

export async function resolveMaintenanceTicket(ticketId: string) {
  const res = await fetch(`${API_BASE_URL}/api/maintenance/tickets/${ticketId}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) throw new Error("Failed to resolve ticket");
  return res.json();
}

export async function fetchDeliveries() {
  const res = await fetch(`${API_BASE_URL}/api/mess/deliveries`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch deliveries");
  return res.json();
}

export async function intakeDelivery(poNumber: string, itemsToRestock?: any[]) {
  const res = await fetch(`${API_BASE_URL}/api/mess/deliveries/intake`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ po_number: poNumber, items_to_restock: itemsToRestock })
  });
  if (!res.ok) throw new Error("Failed to intake vendor delivery");
  return res.json();
}

export async function predictMessDemand(data: {
  day: string;
  is_weekend?: boolean;
  exam_period?: boolean;
  weather_condition?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/mess/predictive-procurement`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to predict mess demand");
  return res.json();
}

export async function predictRoomCohorts() {
  const res = await fetch(`${API_BASE_URL}/api/rooms/predictive-allocation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) throw new Error("Failed to predict room cohorts");
  return res.json();
}

export async function predictMaintenanceRisk(data: {
  room_or_area: string;
  issue_description: string;
  appliance_age_months?: number;
}) {
  const res = await fetch(`${API_BASE_URL}/api/maintenance/predictive-triage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to predict maintenance risk");
  return res.json();
}

export interface CleaningSlotPayload {
  slot_id: number;
  slot_time: string;
  slot_label: string;
  image_url?: string;
  cleaner_present: boolean;
  cleaner_name?: string;
  confidence_score?: number;
  detected_features?: string[];
  notes?: string;
}

export async function inspectCleaningShift(data: {
  room_number: string;
  hostel_name?: string;
  floor?: string;
  inspection_date?: string;
  manager_name?: string;
  manager_phone?: string;
  slots: CleaningSlotPayload[];
  auto_call_if_missing?: boolean;
  agent_id_override?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/maintenance/inspect-cleaning-shift`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to inspect cleaning shift");
  return res.json();
}

export async function analyzeCCTVImage(imageData: string) {
  const res = await fetch(`${API_BASE_URL}/api/maintenance/analyze-cctv-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_data: imageData })
  });
  if (!res.ok) throw new Error("Failed to analyze CCTV image");
  return res.json();
}


