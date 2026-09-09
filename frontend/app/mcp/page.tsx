"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Database,
  Send,
  Code2,
  CheckCircle2,
  Info
} from "lucide-react";

export default function McpPage() {
  const [mcpTool, setMcpTool] = useState<string>("nutrient_lookup");
  const [mcpInput, setMcpInput] = useState<string>("Paneer Butter Masala with Butter Roti");
  const [mcpOutput, setMcpOutput] = useState<any>(null);

  const handleRunMcp = () => {
    if (mcpTool === "nutrient_lookup") {
      setMcpOutput({
        dish: mcpInput,
        portion_g: 380,
        calories: 640,
        protein_g: 24.8,
        carbs_g: 52.0,
        fat_g: 38.0,
        fiber_g: 5.2,
        icmr_status: "MEETS_ICMR_STANDARDS",
        source: "USDA FoodData Central API (FDC-170889)"
      });
    } else if (mcpTool === "cost_estimator") {
      setMcpOutput({
        dish: mcpInput,
        student_headcount: 500,
        batch_ingredients: [
          { item: "Fresh Malai Paneer", qty: "55 kg", wholesale_rate: "₹315/kg", total: "₹17,325" },
          { item: "Hybrid Tomatoes", qty: "25 kg", wholesale_rate: "₹30/kg", total: "₹750" },
          { item: "Table Butter", qty: "8 kg", wholesale_rate: "₹435/kg", total: "₹3,480" },
          { item: "Atta (Wheat Flour)", qty: "45 kg", wholesale_rate: "₹31/kg", total: "₹1,395" }
        ],
        total_batch_cost_inr: 26500.0,
        cost_per_plate_inr: 53.0
      });
    } else if (mcpTool === "leftover_checker") {
      setMcpOutput({
        status: "LEFTOVER_FIRST_TRIGGERED",
        perishable_items: [
          { item: "Hybrid Tomatoes", qty: "48 kg", shelf_life_days: 2, action: "Assign Monday Lunch" },
          { item: "Cauliflower", qty: "35 kg", shelf_life_days: 2, action: "Assign Monday Lunch" },
          { item: "Fresh Spinach (Palak)", qty: "24 kg", shelf_life_days: 1, action: "Assign Monday Dinner" }
        ],
        heuristic_policy: "Expiring perishables allocated to Mon/Tue before new purchase orders."
      });
    } else if (mcpTool === "vendor_price") {
      setMcpOutput({
        item: mcpInput,
        supplier: "Amul Cooperative Wholesaler",
        base_price_inr: "₹340.00 / kg",
        bulk_tier_threshold: ">= 50 kg",
        effective_price_inr: "₹315.00 / kg (Bulk tier discount applied)",
        lead_time: "24 hours",
        catalog_status: "ACTIVE_CONTRACT"
      });
    } else {
      setMcpOutput({
        po_number: "PO-SEM1-WK06-001",
        requisition_total_inr: 443091.0,
        ceiling_inr: 577500.0,
        governance_gate: "AUTO_APPROVED_WITHIN_BUDGET",
        status: "ORDER_TRANSMITTED_TO_APMC_SUPPLIERS"
      });
    }
  };

  const tools = [
    { id: "nutrient_lookup", label: "nutrient_lookup(dish)", sample: "Paneer Butter Masala with Butter Roti", desc: "Maps dish name to calibrated USDA FoodData Central nutritional profile." },
    { id: "cost_estimator", label: "cost_estimator(dish)", sample: "Paneer Butter Masala", desc: "Computes recipe batch weights and per-student plate cost based on wholesale mandi rates." },
    { id: "leftover_checker", label: "leftover_checker(inventory)", sample: "live_pantry", desc: "Scans on-hand stock for items with <= 3 days shelf life to enforce Leftover-First rule." },
    { id: "vendor_price", label: "vendor_price(item)", sample: "Fresh Malai Paneer", desc: "Resolves wholesale APMC mandi price and bulk volume tier discounts." },
    { id: "mock_ordering_api", label: "mock_ordering_api(order)", sample: "week_6_requisition", desc: "Submits purchase orders and evaluates total order against the weekly ceiling." }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-zinc-800 selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        {/* Header */}
        <div className="border-b border-zinc-800/80 pb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-1">
            <span>Interoperability</span>
            <span>•</span>
            <span className="text-white">Model Context Protocol (MCP)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            MCP Connector & Tools Console
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            The standing operations agent communicates with external wholesale price catalogs, pantry inventory, and ordering services via JSON-RPC 2.0 MCP standard endpoints.
          </p>
        </div>

        {/* MCP Playground Container */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tool Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Select MCP Tool
              </label>
              {tools.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setMcpTool(t.id);
                    setMcpInput(t.sample);
                    setMcpOutput(null);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${
                    mcpTool === t.id
                      ? "bg-zinc-100 text-zinc-950 border-zinc-100 shadow-sm"
                      : "bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="text-xs font-mono font-semibold">{t.label}</div>
                  <div className={`text-[11px] mt-1 leading-snug ${mcpTool === t.id ? "text-zinc-700" : "text-zinc-500"}`}>
                    {t.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* Execution Console */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Input Argument
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mcpInput}
                    onChange={(e) => setMcpInput(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-600 font-mono"
                    placeholder="Enter tool parameter..."
                  />
                  <button
                    onClick={handleRunMcp}
                    className="bg-zinc-100 hover:bg-white text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Invoke Tool
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    MCP Response Output (JSON-RPC)
                  </label>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Endpoint: mcp://hostel-mess/{mcpTool}
                  </span>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-200 min-h-[220px] overflow-auto">
                  {mcpOutput ? (
                    <pre className="text-[11px] whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(mcpOutput, null, 2)}
                    </pre>
                  ) : (
                    <div className="h-full flex items-center justify-center text-zinc-600 text-xs py-16">
                      Select an MCP endpoint and click &apos;Invoke Tool&apos; to view live payload...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-6 px-4 text-center text-xs text-zinc-500">
        Hostel Mess Operations Agent • Model Context Protocol Connector Module
      </footer>
    </div>
  );
}
