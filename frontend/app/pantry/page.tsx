"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import { PANTRY_STOCK } from "@/lib/mess-data";
import {
  Layers,
  AlertCircle,
  Clock,
  Sparkles,
  Info
} from "lucide-react";

export default function PantryPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-zinc-800 selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        {/* Header */}
        <div className="border-b border-zinc-800/80 pb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-1">
            <span>Operations Module</span>
            <span>•</span>
            <span className="text-white">Inventory & Waste Mitigation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Pantry Inventory & Leftover-First Allocation
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            The standing agent scans stock before formulating procurement orders. Under the Leftover-First heuristic, perishables with 3 days or fewer remaining shelf life are prioritized into Monday and Tuesday meals to minimize organic food waste.
          </p>
        </div>

        {/* Rule Banner */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase text-zinc-400 font-semibold block">
              Operational Invariant
            </span>
            <p className="text-sm text-white font-medium">
              Leftover-First Rule: 107 kg of aging stock pre-allocated to Week 6 Monday/Tuesday menus.
            </p>
          </div>
          <span className="text-xs font-mono bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-lg text-zinc-300 self-start sm:self-auto">
            Zero Discard Policy
          </span>
        </div>

        {/* Stock Table */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Current Raw Material Stock & Freshness Countdown
            </h2>
            <span className="text-xs font-mono text-zinc-500">
              {PANTRY_STOCK.length} Stock Lots Tracked
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="p-3.5">Stock Item</th>
                  <th className="p-3.5">On-Hand Quantity</th>
                  <th className="p-3.5">Batch ID</th>
                  <th className="p-3.5">Shelf Life Remaining</th>
                  <th className="p-3.5">Urgency Status</th>
                  <th className="p-3.5">Auto-Allocated Meal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {PANTRY_STOCK.map((item, i) => (
                  <tr key={i} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3.5 font-semibold text-white">{item.item}</td>
                    <td className="p-3.5 font-mono">{item.quantity} {item.unit}</td>
                    <td className="p-3.5 font-mono text-zinc-500">{item.batch}</td>
                    <td className="p-3.5 font-medium">
                      {item.days_to_expiry <= 2 ? (
                        <span className="text-white flex items-center gap-1 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5 text-zinc-400" /> {item.days_to_expiry} days
                        </span>
                      ) : (
                        <span className="text-zinc-400">{item.days_to_expiry} days</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                        item.status.includes("CRITICAL") || item.status.includes("URGENT")
                          ? "bg-zinc-800 text-white border border-zinc-600 font-bold"
                          : "bg-zinc-950 text-zinc-400 border border-zinc-800"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-zinc-200">{item.assigned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-6 px-4 text-center text-xs text-zinc-500">
        Hostel Mess Operations Agent • Inventory & Waste Management Module
      </footer>
    </div>
  );
}
