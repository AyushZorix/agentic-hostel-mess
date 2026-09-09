"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import { CONFLICT_DEBATES } from "@/lib/mess-data";
import {
  Cpu,
  Flame,
  TrendingDown,
  Layers,
  ShieldCheck,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

export default function SwarmPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-zinc-800 selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        {/* Header */}
        <div className="border-b border-zinc-800/80 pb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-1">
            <span>Operations Module</span>
            <span>•</span>
            <span className="text-white">Multi-Agent Swarm Orchestration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Parallel Swarm & Consensus Arbitration
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            Three specialized agents evaluate the candidate weekly draft concurrently across separate loss functions. When their priorities conflict, the Menu-Coordinator arbitrates a balanced compromise.
          </p>
        </div>

        {/* 4 Agent Archetypes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-white text-sm">
              <Flame className="w-4 h-4 text-zinc-400" /> Nutrition-Agent
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
              <TrendingDown className="w-4 h-4 text-zinc-400" /> Budget-Agent
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
              <Layers className="w-4 h-4 text-zinc-400" /> Variety-Agent
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
              <ShieldCheck className="w-4 h-4 text-zinc-400" /> Menu-Coordinator
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Enforces Leftover-First rule from pantry inventory, arbitrates deadlocks, negotiates compromise, and writes audit logs.
            </p>
            <div className="pt-2 border-t border-zinc-800 text-[10px] font-mono text-zinc-400">
              Role: Consensus Arbiter
            </div>
          </div>
        </div>

        {/* Arbitration Showcase */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm space-y-6">
          <div className="border-b border-zinc-800/80 pb-4">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Arbitration Log: Conflicts Resolved by Menu-Coordinator
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Demonstrates how the coordinator reconciles opposing agent imperatives into a consensual weekly plan.
            </p>
          </div>

          <div className="space-y-6">
            {CONFLICT_DEBATES.map((conf, idx) => (
              <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-zinc-900 text-zinc-300 border border-zinc-700 text-[10px] font-mono rounded">
                      {conf.conflict_id}
                    </span>
                    <span className="font-semibold text-white text-sm">
                      {conf.topic}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-zinc-900 text-zinc-200 border border-zinc-700 text-[10px] font-mono font-bold rounded self-start sm:self-auto">
                    RESOLVED
                  </span>
                </div>

                {/* Positions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                      Budget-Agent Perspective
                    </span>
                    <p className="text-zinc-300 leading-relaxed">{conf.budget_position}</p>
                  </div>

                  <div className="p-3.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                      Variety-Agent Perspective
                    </span>
                    <p className="text-zinc-300 leading-relaxed">{conf.variety_position}</p>
                  </div>
                </div>

                {/* Coordinator ruling */}
                <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-700 text-xs">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white block mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-zinc-300" /> Menu-Coordinator Arbitration Ruling
                  </span>
                  <p className="text-zinc-200 leading-relaxed">{conf.coordinator_resolution}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-6 px-4 text-center text-xs text-zinc-500">
        Hostel Mess Operations Agent • Multi-Agent Swarm Module
      </footer>
    </div>
  );
}
