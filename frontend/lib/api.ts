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

export async function updatePantryItem(item: string, quantityDelta: number) {
  const res = await fetch(`${API_BASE_URL}/api/inventory/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item, quantity_delta: quantityDelta })
  });
  if (!res.ok) throw new Error("Failed to update inventory item");
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

