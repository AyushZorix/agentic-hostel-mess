"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import {
  FileText,
  Check,
  Code2,
  ExternalLink,
  ChevronRight
} from "lucide-react";

export default function DocsPage() {
  const deliverables = [
    {
      id: "node_graph",
      title: "Node Graph & Architecture Flow",
      file: "docs/node_graph.md",
      desc: "Mermaid flowchart diagram detailing the parallel swarm, MCP tool connector, dual-tier memory lifecycle, and governance approval gates."
    },
    {
      id: "skill_file",
      title: "Packaged Skill File: weekly-menu-planning",
      file: "skills/weekly_menu_planning.md",
      desc: "Standalone operational skill specification defining ICMR nutritional targets, weekly budget ceiling (₹5,77,500), the Leftover-First rule, and output templates."
    },
    {
      id: "memory_schema",
      title: "Dual-Tier Memory Schema & Specification",
      file: "docs/memory_schema.md & memory_schema.json",
      desc: "Strict separation between ephemeral Session State (current draft, active conflicts) and durable Long-Term Memory (waste audits, ratings, complaints)."
    },
    {
      id: "tool_list",
      title: "Operational Tool List & Signatures",
      file: "docs/tool_list.md",
      desc: "Detailed JSON signatures and input/output contracts for nutrient_lookup, cost_estimator, leftover_checker, vendor_price, and MCP endpoints."
    },
    {
      id: "prompt_log",
      title: "Agent Swarm Prompt Log",
      file: "docs/prompt_log.md",
      desc: "Exact system prompts, operational heuristics, and loss functions for Nutrition-Agent, Budget-Agent, Variety-Agent, and Menu-Coordinator."
    },
    {
      id: "execution_trace",
      title: "Semester Execution Trace",
      file: "docs/execution_trace.md & execution_trace.json",
      desc: "Chronological step-by-step turn trace of Week 6 routine planning and Week 8 Diwali festive banquet budget-breach simulation."
    },
    {
      id: "breach_case",
      title: "Budget-Breach Case Study",
      file: "docs/budget_breach_case.md",
      desc: "Detailed documentation of the Diwali banquet exceeding the ceiling (+₹56,909.16) and obtaining 3/3 quorum from Warden, Student Sec, and Mess Manager."
    },
    {
      id: "limitations_note",
      title: "Technical Limitations & Operational Bounds",
      file: "docs/limitations_note.md",
      desc: "Critical analysis of APMC mandi spot price volatility, large-scale steam cooking vitamin loss, and student feedback survey bias."
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-zinc-800 selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        {/* Header */}
        <div className="border-b border-zinc-800/80 pb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-1">
            <span>Documentation</span>
            <span>•</span>
            <span className="text-white">System Deliverables</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            System Deliverables & Architecture
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            All 8 required project artifacts, schemas, prompt logs, execution traces, and architectural documentation implemented in the codebase.
          </p>
        </div>

        {/* Deliverables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deliverables.map((doc, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-zinc-400 bg-zinc-950 border border-zinc-800 px-2.5 py-0.5 rounded">
                    {doc.file}
                  </span>
                  <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>

                <h3 className="text-base font-semibold text-white mt-3 mb-1">
                  {doc.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {doc.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
                <span>Location: Repository Workspace</span>
                <span className="text-zinc-300 font-medium">Fully Documented</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-6 px-4 text-center text-xs text-zinc-500">
        Hostel Mess Operations Agent • Deliverables & Documentation Module
      </footer>
    </div>
  );
}
