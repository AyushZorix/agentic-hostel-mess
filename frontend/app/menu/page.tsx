"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { getLatestMenu, generatePlan } from "@/lib/api";
import { WEEK_6_DATA, WEEK_8_BREACH_DATA, WeeklySchedule } from "@/lib/mess-data";
import {
  Utensils,
  Clock,
  Flame,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Cpu,
  Layers
} from "lucide-react";

export default function MenuPage() {
  const [selectedWeek, setSelectedWeek] = useState<number>(6);
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [scheduleData, setScheduleData] = useState<WeeklySchedule | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const loadMenu = async () => {
    try {
      setLoading(true);
      const data = await getLatestMenu();
      if (data && data.schedule) {
        setScheduleData(data);
        setSelectedWeek(data.week_number || 6);
      } else {
        setScheduleData(selectedWeek === 6 ? WEEK_6_DATA : WEEK_8_BREACH_DATA);
      }
    } catch (err) {
      console.warn("Backend not reachable or error, falling back to local dataset:", err);
      setScheduleData(selectedWeek === 6 ? WEEK_6_DATA : WEEK_8_BREACH_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const handleRunAgentCycle = async (forceBreach: boolean = false) => {
    try {
      setGenerating(true);
      const targetWeek = forceBreach ? 8 : 6;
      const res = await generatePlan(targetWeek, forceBreach);
      if (res && res.plan) {
        setScheduleData(res.plan);
        setSelectedWeek(targetWeek);
      }
    } catch (err) {
      console.error("Agent cycle failed:", err);
      alert("Failed to run agent planning cycle. Please check backend connection.");
    } finally {
      setGenerating(false);
    }
  };

  const currentSchedule = scheduleData || (selectedWeek === 6 ? WEEK_6_DATA : WEEK_8_BREACH_DATA);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-zinc-800 selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-1">
              <span>Operations Module</span>
              <span>•</span>
              <span className="text-white">7-Day Meal Matrix</span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                Live Groq Llama Swarm
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Weekly Hostel Menu Plan
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
              Constructed dynamically by the standing Menu-Coordinator agent. Enforces the Leftover-First rule for Mon/Tue meals, maintains ICMR protein benchmarks, and audits wholesale APMC Mandi pricing against PostgreSQL inventory.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              disabled={generating}
              onClick={() => handleRunAgentCycle(false)}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-white flex items-center gap-2 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin text-emerald-400" : ""}`} />
              <span>{generating ? "Agent Swarm Running..." : "Run Routine Cycle (Wk 6)"}</span>
            </button>
            <button
              disabled={generating}
              onClick={() => handleRunAgentCycle(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-300 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Simulate Feast Breach (Wk 8)</span>
            </button>
          </div>
        </div>

        {/* Day Selector Pills */}
        <div className="flex overflow-x-auto gap-2 p-1.5 bg-zinc-900/80 rounded-xl border border-zinc-800">
          {days.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg text-xs font-semibold transition-all text-center ${
                selectedDay === d
                  ? "bg-zinc-100 text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {d}
              <span className="block text-[10px] font-normal opacity-70 mt-0.5">
                {currentSchedule.schedule[d]?.daily_protein_g}g Protein
              </span>
            </button>
          ))}
        </div>

        {/* Active Day Overview Card */}
        {currentSchedule.schedule[selectedDay] && (
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>{selectedDay}&apos;s Meal Breakdown</span>
                  <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded">
                    500 Resident Portions
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Macronutrients verified against ICMR adult nutritional standards
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <div className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg">
                  <span className="text-zinc-400">Calories: </span>
                  <span className="font-bold text-white">
                    {currentSchedule.schedule[selectedDay].daily_calories} kcal
                  </span>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg">
                  <span className="text-zinc-400">Protein: </span>
                  <span className={`font-bold ${currentSchedule.schedule[selectedDay].daily_protein_g >= 68 ? "text-emerald-400" : "text-amber-400"}`}>
                    {currentSchedule.schedule[selectedDay].daily_protein_g}g
                  </span>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg">
                  <span className="text-zinc-400">Cost/Student: </span>
                  <span className="font-bold text-white">
                    ₹{currentSchedule.schedule[selectedDay].cost_per_student_day_inr}
                  </span>
                </div>
              </div>
            </div>

            {/* Meal Slots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(["breakfast", "lunch", "snack", "dinner"] as const).map((slot) => {
                const dish = currentSchedule.schedule[selectedDay][slot];
                if (!dish) return null;
                return (
                  <div
                    key={slot}
                    className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-all space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                          {slot}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          ₹{dish.cost_per_plate_inr}/plate
                        </span>
                      </div>

                      <h3 className="font-semibold text-white text-sm leading-snug">
                        {dish.name}
                      </h3>

                      {dish.leftover_utilized && dish.leftover_utilized.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
                          <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                          <span>Leftover Prioritized: {dish.leftover_utilized.join(", ")}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-zinc-900 grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-400">
                      <div>
                        <span>Cal: </span>
                        <span className="text-zinc-200">{dish.calories} kcal</span>
                      </div>
                      <div>
                        <span>Protein: </span>
                        <span className="text-zinc-200">{dish.protein_g}g</span>
                      </div>
                      <div>
                        <span>Carbs: </span>
                        <span className="text-zinc-200">{dish.carbs_g}g</span>
                      </div>
                      <div>
                        <span>Fat: </span>
                        <span className="text-zinc-200">{dish.fat_g}g</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resolved Swarm Conflicts Overview */}
        {currentSchedule.conflicts_resolved && currentSchedule.conflicts_resolved.length > 0 && (
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Consensus Conflicts Resolved by Coordinator Agent ({currentSchedule.conflicts_resolved.length})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentSchedule.conflicts_resolved.map((conf: any, idx: number) => (
                <div key={idx} className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-zinc-300">{conf.conflict_id}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">{conf.agents?.join(" vs ")}</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">{conf.description}</p>
                  <p className="text-emerald-400 text-[11px] font-medium pt-1 border-t border-zinc-900">
                    Resolution: {conf.resolution}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
