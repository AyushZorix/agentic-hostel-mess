"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { WEEK_6_DATA, WEEK_8_BREACH_DATA, WeeklySchedule } from "@/lib/mess-data";
import {
  Utensils,
  Clock,
  Flame,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  RefreshCw
} from "lucide-react";

export default function MenuPage() {
  const [selectedWeek, setSelectedWeek] = useState<number>(6);
  const [selectedDay, setSelectedDay] = useState<string>("Monday");

  const currentSchedule: WeeklySchedule = selectedWeek === 6 ? WEEK_6_DATA : WEEK_8_BREACH_DATA;
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Weekly Hostel Menu Plan
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
              Constructed by the standing Menu-Coordinator agent. Enforces the Leftover-First rule for Mon/Tue meals, maintains ICMR protein benchmarks, and stays within the weekly budget ceiling.
            </p>
          </div>

          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs self-start sm:self-auto">
            <button
              onClick={() => setSelectedWeek(6)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedWeek === 6 ? "bg-zinc-100 text-zinc-950 font-bold shadow-sm" : "text-zinc-400 hover:text-white"
              }`}
            >
              Week 6 (Routine)
            </button>
            <button
              onClick={() => setSelectedWeek(8)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                selectedWeek === 8 ? "bg-zinc-100 text-zinc-950 font-bold shadow-sm" : "text-zinc-400 hover:text-white"
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Week 8 (Diwali Feast)
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

              <div className="flex items-center gap-3 text-xs">
                <div className="bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Total Energy</span>
                  <span className="font-bold text-white">
                    {currentSchedule.schedule[selectedDay].daily_calories} kcal
                  </span>
                </div>
                <div className="bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Total Protein</span>
                  <span className="font-bold text-white">
                    {currentSchedule.schedule[selectedDay].daily_protein_g} g
                  </span>
                </div>
                <div className="bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Daily Rate / Person</span>
                  <span className="font-bold text-white">
                    ₹{currentSchedule.schedule[selectedDay].cost_per_student_day_inr.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Meal Slots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { slot: "Breakfast", data: currentSchedule.schedule[selectedDay].breakfast, time: "07:30 - 09:30 AM" },
                { slot: "Lunch", data: currentSchedule.schedule[selectedDay].lunch, time: "12:30 - 02:30 PM" },
                { slot: "Snack & Chai", data: currentSchedule.schedule[selectedDay].snack, time: "05:00 - 06:30 PM" },
                { slot: "Dinner", data: currentSchedule.schedule[selectedDay].dinner, time: "07:30 - 09:45 PM" }
              ].map((m, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        {m.slot}
                      </span>
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {m.time}
                      </span>
                    </div>

                    <h3 className="font-semibold text-white text-sm leading-snug mb-2">
                      {m.data.name}
                    </h3>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-300">
                        {m.data.diet}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-zinc-900 border border-zinc-800 text-zinc-400">
                        {m.data.region} Indian
                      </span>
                    </div>

                    {/* Leftover Tag */}
                    {m.data.leftover_utilized && m.data.leftover_utilized.length > 0 && (
                      <div className="my-2 p-2 rounded bg-zinc-900 border border-zinc-700 text-[11px] text-zinc-200">
                        <span className="font-semibold block text-[10px] uppercase text-zinc-400 mb-0.5">
                          Leftover-First Priority:
                        </span>
                        {m.data.leftover_utilized.join(", ")}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-zinc-800/80 pt-3 mt-3 grid grid-cols-3 gap-1 text-center text-xs">
                    <div>
                      <span className="text-zinc-500 text-[9px] block uppercase font-mono">Cal</span>
                      <span className="font-medium text-zinc-200">{m.data.calories}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[9px] block uppercase font-mono">Prot</span>
                      <span className="font-medium text-white">{m.data.protein_g}g</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[9px] block uppercase font-mono">Cost</span>
                      <span className="font-medium text-zinc-200">₹{m.data.cost_per_plate_inr.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-6 px-4 text-center text-xs text-zinc-500">
        Hostel Mess Operations Agent • Weekly Menu Planner Module
      </footer>
    </div>
  );
}
