"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { CONFLICT_DEBATES } from "@/lib/mess-data";
import { API_BASE_URL } from "@/lib/api";
import {
  Cpu,
  Flame,
  TrendingDown,
  Layers,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Play,
  RotateCcw,
  Sparkles,
  AlertTriangle
} from "lucide-react";

interface StreamEvent {
  type: string;
  stage?: string;
  message?: string;
  agent?: string;
  action?: string;
  content?: string;
  critique?: string;
  day?: string;
  conflict?: any;
  result?: any;
}

export default function SwarmPage() {
  const [streamEvents, setStreamEvents] = useState<StreamEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [selectedScenario, setSelectedScenario] = useState<"routine" | "breach">("routine");

  const startLiveSwarmStream = (forceBreach: boolean = false) => {
    setStreamEvents([]);
    setIsStreaming(true);
    const targetWeek = forceBreach ? 8 : 6;
    const eventSource = new EventSource(`${API_BASE_URL}/api/agents/stream-cycle?week_number=${targetWeek}&force_breach=${forceBreach}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setStreamEvents((prev) => [...prev, data]);
        if (data.type === "CYCLE_COMPLETE") {
          setIsStreaming(false);
          eventSource.close();
        }
      } catch (err) {
        console.error("Failed to parse SSE event:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn("SSE stream closed or encountered error:", err);
      setIsStreaming(false);
      eventSource.close();
    };
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-zinc-800 selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-1">
              <span>Operations Module</span>
              <span>•</span>
              <span className="text-white">Multi-Agent Swarm Orchestration</span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                Real-Time SSE Streaming
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Parallel Swarm & Consensus Arbitration
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
              Three specialized agents evaluate the candidate weekly draft concurrently across separate loss functions. When their priorities conflict, the Menu-Coordinator arbitrates a balanced compromise.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              disabled={isStreaming}
              onClick={() => {
                setSelectedScenario("routine");
                startLiveSwarmStream(false);
              }}
              className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isStreaming ? "animate-pulse text-emerald-600" : ""}`} />
              <span>{isStreaming ? "Streaming Swarm..." : "Stream Routine Swarm (Wk 6)"}</span>
            </button>
            <button
              disabled={isStreaming}
              onClick={() => {
                setSelectedScenario("breach");
                startLiveSwarmStream(true);
              }}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-amber-300 flex items-center gap-2 transition-all shadow-sm"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Stream Breach Swarm (Wk 8)</span>
            </button>
          </div>
        </div>

        {/* 4 Agent Archetypes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-white text-sm">
              <Flame className="w-4 h-4 text-emerald-400" /> Nutrition-Agent
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Audits candidate meals against ICMR adult guidelines: 2,200–2,500 kcal, min 68.0g protein/day, fiber and micronutrient density.
            </p>
            <div className="pt-2 border-t border-zinc-800 text-[10px] font-mono text-zinc-400">
              Loss: Protein Deficit Penalty
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-white text-sm">
              <TrendingDown className="w-4 h-4 text-blue-400" /> Budget-Agent
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Monitors wholesale APMC mandi pricing, leverages bulk volume tiers (&gt;250kg Atta), and caps daily rate at ₹165/student.
            </p>
            <div className="pt-2 border-t border-zinc-800 text-[10px] font-mono text-zinc-400">
              Loss: Cost Overrun Penalty
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-white text-sm">
              <Layers className="w-4 h-4 text-purple-400" /> Variety-Agent
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Enforces the Max 3 Potato rule, Max 2 Paneer rule, alternates dals, and down-weights dishes with high historical plate waste.
            </p>
            <div className="pt-2 border-t border-zinc-800 text-[10px] font-mono text-zinc-400">
              Loss: Repetition & Waste Penalty
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-white text-sm">
              <ShieldCheck className="w-4 h-4 text-amber-400" /> Menu-Coordinator
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Enforces Leftover-First rule from pantry inventory, arbitrates deadlocks, negotiates compromise, and writes audit logs.
            </p>
            <div className="pt-2 border-t border-zinc-800 text-[10px] font-mono text-zinc-400">
              Role: Consensus Arbiter
            </div>
          </div>
        </div>

        {/* Live SSE Stream Console */}
        {streamEvents.length > 0 && (
          <div className="bg-zinc-950 border border-emerald-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h3 className="font-semibold text-sm text-white font-mono">
                  Live Swarm Execution Feed ({streamEvents.length} events recorded)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                {isStreaming ? "Streaming active..." : "Cycle finalized"}
              </span>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-2 font-mono text-xs">
              {streamEvents.map((evt, index) => (
                <div
                  key={index}
                  className="p-3 bg-zinc-900/90 border border-zinc-800/80 rounded-xl space-y-1 transition-all"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-400 font-bold">{evt.type}</span>
                      {evt.type === "AGENT_THOUGHT" && (
                        <span className="text-[9px] font-mono text-purple-300 bg-purple-950/60 border border-purple-800/60 px-1.5 py-0.2 rounded">
                          MCP: mess://inventory
                        </span>
                      )}
                      {evt.type === "AGENT_CRITIQUE" && evt.agent === "Budget-Agent" && (
                        <span className="text-[9px] font-mono text-blue-300 bg-blue-950/60 border border-blue-800/60 px-1.5 py-0.2 rounded">
                          MCP: mess://vendor-prices
                        </span>
                      )}
                    </div>
                    {evt.agent && (
                      <span className="text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">
                        {evt.agent}
                      </span>
                    )}
                  </div>
                  {evt.message && <p className="text-zinc-200">{evt.message}</p>}
                  {evt.content && <p className="text-zinc-300">{evt.content}</p>}
                  {evt.critique && (
                    <p className="text-amber-300/90">
                      {evt.day ? `[${evt.day}] ` : ""}{evt.critique}
                    </p>
                  )}
                  {evt.conflict && (
                    <div className="mt-2 p-2 bg-zinc-950 border border-zinc-800 rounded text-[11px]">
                      <span className="text-white font-bold">{evt.conflict.conflict_id}: </span>
                      <span className="text-zinc-400">{evt.conflict.description}</span>
                      <p className="text-emerald-400 mt-1 font-semibold">Resolution: {evt.conflict.resolution}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Arbitration Showcase */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm space-y-6">
          <div className="border-b border-zinc-800/80 pb-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Arbitration Showcase: Conflict Resolutions</span>
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded">
                Multi-Turn Consensus
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Recorded conflict arbitrations demonstrating how the Menu-Coordinator balances divergent loss functions
            </p>
          </div>

          <div className="space-y-4">
            {CONFLICT_DEBATES.map((item, idx) => (
              <div
                key={idx}
                className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4 hover:border-zinc-700 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded">
                      {item.conflict_id}
                    </span>
                    <span className="text-xs font-semibold text-zinc-200">
                      {item.topic}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                    <span>{item.agents?.[0]}</span>
                    <span>vs</span>
                    <span>{item.agents?.[1]}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 p-3.5 bg-zinc-900/60 rounded-lg border border-zinc-800/60">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-semibold">
                      Agent Positions & Critiques
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {item.budget_position || item.variety_position || item.nutrition_input}
                    </p>
                  </div>

                  <div className="space-y-1.5 p-3.5 bg-emerald-950/20 rounded-lg border border-emerald-500/20">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                      Coordinator Resolution
                    </span>
                    <p className="text-xs text-zinc-200 leading-relaxed">
                      {item.coordinator_resolution}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-2 border-t border-zinc-900">
                  <span>Status: {item.status || "RESOLVED"}</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Consensual Agreement
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
