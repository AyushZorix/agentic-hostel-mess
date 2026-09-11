"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { sendMCPRpc, getMCPResources, API_BASE_URL } from "@/lib/api";
import {
  Database,
  Send,
  Code2,
  CheckCircle2,
  Info,
  Play,
  RefreshCw,
  Layers,
  Terminal,
  Server,
  Globe,
  Radio,
  FileCode,
  ShieldCheck,
  Cpu
} from "lucide-react";

export default function McpPage() {
  const [protocolInfo, setProtocolInfo] = useState<any>(null);
  const [resourcesList, setResourcesList] = useState<any[]>([]);
  const [toolsList, setToolsList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"tools" | "resources" | "terminal">("tools");
  
  // Terminal state
  const [rpcMethod, setRpcMethod] = useState<string>("tools/list");
  const [rawRpcPayload, setRawRpcPayload] = useState<string>(
    JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }, null, 2)
  );
  const [rpcResponse, setRpcResponse] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [resourceContent, setResourceContent] = useState<any>(null);

  // Tool execution state
  const [selectedTool, setSelectedTool] = useState<string>("vendor_price_list");
  const [toolArguments, setToolArguments] = useState<string>(
    JSON.stringify({ category: "Vegetables" }, null, 2)
  );

  const initMCP = async () => {
    try {
      setLoading(true);
      // Initialize RPC
      const initRes = await sendMCPRpc({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {}
      });
      if (initRes && initRes.result) {
        setProtocolInfo(initRes.result);
      }

      // Load resources & tools
      const resData = await getMCPResources();
      if (resData) {
        setResourcesList(resData.resources || []);
        setToolsList(resData.tools || []);
      }
    } catch (err) {
      console.warn("MCP init warning:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initMCP();
  }, []);

  const handleSendRawRpc = async () => {
    try {
      setLoading(true);
      const parsed = JSON.parse(rawRpcPayload);
      const res = await sendMCPRpc(parsed);
      setRpcResponse(res);
    } catch (err: any) {
      setRpcResponse({ error: { code: -32700, message: "Parse error / Invalid JSON: " + err.message } });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (methodName: string) => {
    setRpcMethod(methodName);
    let payload: any = { jsonrpc: "2.0", id: Date.now() };

    if (methodName === "initialize") {
      payload.method = "initialize";
      payload.params = {};
    } else if (methodName === "tools/list") {
      payload.method = "tools/list";
      payload.params = {};
    } else if (methodName === "resources/list") {
      payload.method = "resources/list";
      payload.params = {};
    } else if (methodName === "resources/read:vendor-prices") {
      payload.method = "resources/read";
      payload.params = { uri: "mess://vendor-prices" };
    } else if (methodName === "resources/read:inventory") {
      payload.method = "resources/read";
      payload.params = { uri: "mess://inventory" };
    } else if (methodName === "tools/call:vendor_price_list") {
      payload.method = "tools/call";
      payload.params = {
        name: "vendor_price_list",
        arguments: { category: "Grains & Flour", max_price: 60 }
      };
    } else if (methodName === "tools/call:mock_ordering_api") {
      payload.method = "tools/call";
      payload.params = {
        name: "mock_ordering_api",
        arguments: {
          week_number: 6,
          requested_by: "Menu-Coordinator",
          notes: "Routine staples order for Week 6",
          items: [
            { item: "Atta (Whole Wheat Flour)", quantity: 300 },
            { item: "Basmati Sella Rice", quantity: 350 },
            { item: "Fresh Malai Paneer", quantity: 110 }
          ]
        }
      };
    }
    setRawRpcPayload(JSON.stringify(payload, null, 2));
  };

  const handleReadResource = async (uri: string) => {
    setSelectedResource(uri);
    try {
      setLoading(true);
      const res = await sendMCPRpc({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "resources/read",
        params: { uri }
      });
      setResourceContent(res.result || res);
    } catch (err) {
      console.warn("Resource read failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTool = async () => {
    try {
      setLoading(true);
      const parsedArgs = JSON.parse(toolArguments);
      const res = await sendMCPRpc({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: selectedTool,
          arguments: parsedArgs
        }
      });
      setRpcResponse(res.result || res);
    } catch (err: any) {
      setRpcResponse({ error: { message: "Execution error: " + err.message } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-zinc-800 selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-1">
              <span>Integration Protocol</span>
              <span>•</span>
              <span className="text-white">Model Context Protocol (MCP)</span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/20 font-mono flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" /> Live JSON-RPC 2.0
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Model Context Protocol (MCP) Server Console
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
              Decoupled Model Context Protocol server exposing wholesale Mandi catalogs, pantry inventory, and purchase ordering APIs as discoverable tools and URI resources for autonomous agents.
            </p>
          </div>

          <button
            onClick={initMCP}
            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold rounded-xl border border-zinc-800 transition-all flex items-center gap-2 text-zinc-200 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            <span>Ping MCP Server</span>
          </button>
        </div>

        {/* Server Connection Spec Card */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="space-y-1">
            <span className="text-zinc-400 text-[10px] uppercase tracking-wider block">Protocol Status</span>
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> ACTIVE (JSON-RPC 2.0)
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-zinc-400 text-[10px] uppercase tracking-wider block">Protocol Version</span>
            <div className="font-bold text-white">
              {protocolInfo?.protocolVersion || "2024-11-05"}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-zinc-400 text-[10px] uppercase tracking-wider block">Server Implementation</span>
            <div className="font-bold text-zinc-200">
              {protocolInfo?.serverInfo?.name || "hostel-mess-mcp-server"} v1.0.0
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-zinc-400 text-[10px] uppercase tracking-wider block">Capabilities</span>
            <div className="font-bold text-emerald-400 flex items-center gap-2">
              <span>tools: true</span>
              <span>•</span>
              <span>resources: true</span>
            </div>
          </div>
        </div>

        {/* Console Navigation Tabs */}
        <div className="flex border-b border-zinc-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab("tools")}
            className={`py-3 px-5 font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "tools"
                ? "border-white text-white bg-zinc-900/50"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Discoverable Tools ({toolsList.length || 3})</span>
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className={`py-3 px-5 font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "resources"
                ? "border-white text-white bg-zinc-900/50"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>MCP Resources ({resourcesList.length || 2})</span>
          </button>
          <button
            onClick={() => setActiveTab("terminal")}
            className={`py-3 px-5 font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "terminal"
                ? "border-white text-white bg-zinc-900/50"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>JSON-RPC 2.0 Terminal</span>
          </button>
        </div>

        {/* Tab 1: Discoverable Tools */}
        {activeTab === "tools" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Registered MCP Tools
              </h2>
              <div className="space-y-2">
                {[
                  {
                    name: "mess_vendor_prices",
                    desc: "Fetch wholesale APMC Mandi commodity rates with bulk tier discounts and supplier info.",
                    sampleArgs: { category: "Vegetables", max_price: 60 }
                  },
                  {
                    name: "mess_pantry_inventory",
                    desc: "Inspect pantry stock levels, lot numbers, batch IDs, and days-to-expiration countdowns.",
                    sampleArgs: { filter_expiring_only: true }
                  },
                  {
                    name: "mess_order_and_budget_check",
                    desc: "Submit wholesale purchase orders with automated weekly budget ceiling checks.",
                    sampleArgs: {
                      week_number: 6,
                      requested_by: "Menu-Coordinator",
                      items: [
                        { item: "Atta (Whole Wheat Flour)", quantity: 300 },
                        { item: "Fresh Malai Paneer", quantity: 120 }
                      ]
                    }
                  },
                  {
                    name: "mess_ingest_vendor_delivery",
                    desc: "Intake confirmed order items from vendor voice call into live PostgreSQL pantry inventory.",
                    sampleArgs: {
                      po_number: "PO-MES-204",
                      items: [
                        { item: "Farm Fresh Tomatoes", quantity_added: 50, unit: "kg" },
                        { item: "Standardized Milk", quantity_added: 40, unit: "L" }
                      ]
                    }
                  },
                  {
                    name: "rooms_query_vacancies",
                    desc: "Query live room vacancies across Block A (Single), Block B (Double), and Block C (Triple).",
                    sampleArgs: { preferred_block: "Block A", room_type: "Single" }
                  },
                  {
                    name: "rooms_score_applicant",
                    desc: "Compute multi-factor priority score (Seniority + Medical + Distance) for student housing applicant.",
                    sampleArgs: { student_name: "Aarav Sharma", year_of_study: 4, distance_km: 1450, has_medical_priority: true }
                  },
                  {
                    name: "rooms_execute_allocation",
                    desc: "Autonomous room allocation agent mapping applicant to optimal room based on priority score.",
                    sampleArgs: { student_id: "STU-402", student_name: "Aarav Sharma", priority_score: 98.5, preferred_type: "Single" }
                  },
                  {
                    name: "maintenance_triage_hazard",
                    desc: "Autonomous NLP hazard detection calculating severity (CRITICAL, HIGH), SLA hours, and failure probability.",
                    sampleArgs: { room_or_area: "Block A - Room 201", issue_description: "Ceiling fan regulator short circuit sparking", appliance_age_months: 24 }
                  },
                  {
                    name: "maintenance_dispatch_technician",
                    desc: "Dispatch designated technician to room hazard and initiate SLA countdown.",
                    sampleArgs: { room_or_area: "Block A - Room 201", issue: "Ceiling fan short circuit", severity: "CRITICAL", assigned_to: "Electrician Team A" }
                  }
                ].map((tool) => (
                  <button
                    key={tool.name}
                    onClick={() => {
                      setSelectedTool(tool.name);
                      setToolArguments(JSON.stringify(tool.sampleArgs, null, 2));
                      setRpcResponse(null);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all space-y-1.5 ${
                      selectedTool === tool.name
                        ? "bg-zinc-900 border-zinc-600 shadow-sm"
                        : "bg-zinc-950 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                        {tool.name}
                      </span>
                      {selectedTool === tool.name && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{tool.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <span className="text-xs font-mono text-zinc-400">
                    Executing Tool: <strong className="text-white">{selectedTool}</strong>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">Method: tools/call</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    Input Parameters (JSON Schema Validation)
                  </label>
                  <textarea
                    rows={6}
                    value={toolArguments}
                    onChange={(e) => setToolArguments(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-500 leading-relaxed"
                  />
                </div>

                <button
                  disabled={loading}
                  onClick={handleExecuteTool}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${loading ? "animate-spin" : ""}`} />
                  <span>{loading ? "Calling MCP Protocol..." : "Invoke tools/call via JSON-RPC"}</span>
                </button>
              </div>

              {rpcResponse && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-2 font-mono text-xs shadow-lg">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-800/80 pb-2">
                    <span className="text-emerald-400 font-semibold">JSON-RPC 2.0 Response Result</span>
                    <span>200 OK</span>
                  </div>
                  <pre className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-x-auto text-[11px] text-zinc-200 leading-relaxed max-h-80">
                    {JSON.stringify(rpcResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: MCP Resources */}
        {activeTab === "resources" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Exposed URI Resources
              </h2>
              <div className="space-y-3">
                {[
                  {
                    uri: "mess://vendor-prices",
                    name: "Wholesale Mandi Catalog",
                    desc: "Live wholesale rate sheet from contracted APMC Mandi, Amul cooperative, and pulse mill suppliers."
                  },
                  {
                    uri: "mess://inventory",
                    name: "Real-Time Mess Pantry Stock",
                    desc: "On-hand inventory levels, batch IDs, and expiration countdowns for Leftover-First heuristic enforcement."
                  }
                ].map((res) => (
                  <div
                    key={res.uri}
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      selectedResource === res.uri
                        ? "bg-zinc-900 border-zinc-600"
                        : "bg-zinc-950 border-zinc-800/80"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-mono font-bold text-emerald-400">{res.uri}</div>
                      <div className="text-xs font-semibold text-white">{res.name}</div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{res.desc}</p>
                    </div>
                    <button
                      onClick={() => handleReadResource(res.uri)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Globe className="w-3.5 h-3.5 text-zinc-400" />
                      <span>resources/read</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <span className="text-xs font-mono text-zinc-400">
                    Resource Viewer: <strong className="text-white">{selectedResource || "Select a resource URI"}</strong>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">MIME: application/json</span>
                </div>

                {resourceContent ? (
                  <pre className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl overflow-x-auto text-[11px] font-mono text-zinc-200 leading-relaxed max-h-96">
                    {JSON.stringify(resourceContent, null, 2)}
                  </pre>
                ) : (
                  <div className="py-16 text-center text-xs font-mono text-zinc-500">
                    Click &quot;resources/read&quot; on any URI above to inspect live MCP contents.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Raw JSON-RPC 2.0 Terminal */}
        {activeTab === "terminal" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Quick JSON-RPC 2.0 Templates
              </h2>
              <div className="space-y-1.5">
                {[
                  { label: "initialize", val: "initialize" },
                  { label: "tools/list", val: "tools/list" },
                  { label: "resources/list", val: "resources/list" },
                  { label: "resources/read: vendor-prices", val: "resources/read:vendor-prices" },
                  { label: "resources/read: inventory", val: "resources/read:inventory" },
                  { label: "tools/call: vendor_price_list", val: "tools/call:vendor_price_list" },
                  { label: "tools/call: mock_ordering_api", val: "tools/call:mock_ordering_api" }
                ].map((tpl) => (
                  <button
                    key={tpl.val}
                    onClick={() => handleSelectTemplate(tpl.val)}
                    className="w-full text-left p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-xs font-mono text-zinc-300 transition-all flex items-center justify-between"
                  >
                    <span>{tpl.label}</span>
                    <Code2 className="w-3.5 h-3.5 text-zinc-500" />
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <span className="text-xs font-mono text-zinc-400">
                    Endpoint: <strong className="text-emerald-400">POST /api/mcp/rpc</strong>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                    JSON-RPC 2.0 Spec
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    Raw JSON-RPC Request Payload
                  </label>
                  <textarea
                    rows={8}
                    value={rawRpcPayload}
                    onChange={(e) => setRawRpcPayload(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-500 leading-relaxed"
                  />
                </div>

                <button
                  disabled={loading}
                  onClick={handleSendRawRpc}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit JSON-RPC Frame</span>
                </button>
              </div>

              {rpcResponse && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-2 font-mono text-xs shadow-lg">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-800/80 pb-2">
                    <span className="text-emerald-400 font-semibold">JSON-RPC 2.0 Response Frame</span>
                    <span>Status: 200 OK</span>
                  </div>
                  <pre className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-x-auto text-[11px] text-zinc-200 leading-relaxed max-h-96">
                    {JSON.stringify(rpcResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
