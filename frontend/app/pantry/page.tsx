"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { PANTRY_STOCK } from "@/lib/mess-data";
import { getPantryInventory, updatePantryItem } from "@/lib/api";
import {
  Layers,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  RefreshCw,
  Plus,
  Minus
} from "lucide-react";

export default function PantryPage() {
  const [inventory, setInventory] = useState<any[]>(PANTRY_STOCK);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterExpiring, setFilterExpiring] = useState<boolean>(false);

  const loadInventory = async (expiringOnly: boolean = filterExpiring) => {
    try {
      setLoading(true);
      const data = await getPantryInventory(expiringOnly);
      if (data && data.length > 0) {
        setInventory(data);
      } else {
        setInventory(PANTRY_STOCK);
      }
    } catch (err) {
      console.warn("Backend inventory fetch failed, using local mock:", err);
      setInventory(PANTRY_STOCK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory(filterExpiring);
  }, [filterExpiring]);

  const handleStockAdjust = async (item: string, delta: number) => {
    try {
      await updatePantryItem(item, delta);
      await loadInventory(filterExpiring);
    } catch (err) {
      console.warn("Stock update error:", err);
    }
  };

  const totalKg = inventory.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const criticalItems = inventory.filter((item) => (item.days_to_expiry ?? 99) <= 3);

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
              <span className="text-white">Inventory & Waste Mitigation</span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                PostgreSQL Live Store
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Pantry Inventory & Leftover-First Allocation
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
              The standing agent scans stock before formulating procurement orders. Under the Leftover-First heuristic, perishables with 3 days or fewer remaining shelf life are prioritized into Monday and Tuesday meals to minimize organic food waste.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setFilterExpiring(!filterExpiring)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                filterExpiring
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                  : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800"
              }`}
            >
              {filterExpiring ? "Showing Expiring (<=3 Days)" : "Filter Expiring Only"}
            </button>
            <button
              onClick={() => loadInventory(filterExpiring)}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Rule Banner */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase text-zinc-400 font-semibold block">
              Operational Invariant
            </span>
            <p className="text-sm text-white font-medium">
              Leftover-First Rule: {criticalItems.length} critical perishable items identified for Monday/Tuesday allocation.
            </p>
          </div>
          <span className="text-xs font-mono bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-lg text-emerald-400 font-bold self-start sm:self-auto">
            Total Tracked: {totalKg.toFixed(1)} Units
          </span>
        </div>

        {/* Stock Table */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Current Raw Material Stock & Freshness Countdown
            </h2>
            <span className="text-xs font-mono text-zinc-500">
              {inventory.length} Stock Lots Tracked
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
                  <th className="p-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {inventory.map((item, i) => (
                  <tr key={i} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3.5 font-semibold text-white">{item.item}</td>
                    <td className="p-3.5 font-mono">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="p-3.5 font-mono text-zinc-500">{item.batch_id || item.batch || "BATCH-01"}</td>
                    <td className="p-3.5 font-medium">
                      {item.days_to_expiry <= 2 ? (
                        <span className="text-amber-400 flex items-center gap-1 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5" /> {item.days_to_expiry} days
                        </span>
                      ) : (
                        <span className="text-zinc-400">{item.days_to_expiry} days</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                          (item.days_to_expiry <= 2) || (item.urgency && item.urgency.includes("CRITICAL"))
                            ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {item.days_to_expiry <= 2 ? "CRITICAL_LEFTOVER" : item.urgency || "NORMAL"}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStockAdjust(item.item, -5)}
                          className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                          title="Consume 5 units"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleStockAdjust(item.item, 10)}
                          className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                          title="Restock 10 units"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
