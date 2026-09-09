"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { HandwritingText } from "@/components/ui/handwriting-text";
import {
  Utensils,
  Shield,
  Layers,
  Cpu,
  Database,
  FileText,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Flame,
  CheckCircle2,
  Calendar
} from "lucide-react";

export default function Home() {
  const routes = [
    {
      href: "/menu",
      title: "7-Day Menu Matrix",
      desc: "Interactive weekly meal schedule across Breakfast, Lunch, Snacks, and Dinner with ICMR nutrition & leftover-first priority.",
      icon: Utensils,
      badge: "7 Days • 28 Meals"
    },
    {
      href: "/swarm",
      title: "Parallel Swarm & Debate",
      desc: "Watch Nutrition-Agent, Budget-Agent, and Variety-Agent critique proposals and see Menu-Coordinator arbitrate conflicts.",
      icon: Cpu,
      badge: "3 Agents + Coordinator"
    },
    {
      href: "/governance",
      title: "Governance Approval Gate",
      desc: "Live simulation of the Diwali banquet budget breach (+₹56.9k) requiring Warden and Student General Secretary sign-off.",
      icon: Shield,
      badge: "Human-in-the-Loop"
    },
    {
      href: "/pantry",
      title: "Leftover-First Pantry",
      desc: "Pantry inventory tracker prioritizing perishable ingredients (shelf life <= 3 days) into Monday and Tuesday meals.",
      icon: Layers,
      badge: "Food Waste Reduction"
    },
    {
      href: "/mcp",
      title: "MCP Connector & Tools",
      desc: "Interactive console to invoke live MCP tools: nutrient_lookup, cost_estimator, leftover_checker, and mock_ordering_api.",
      icon: Database,
      badge: "JSON-RPC 2.0"
    },
    {
      href: "/docs",
      title: "Deliverables & Specs",
      desc: "Comprehensive engineering documentation: Node Graph, Skill File, Memory Schemas, Prompt Logs, and Limitations Note.",
      icon: FileText,
      badge: "8 Technical Docs"
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-zinc-800 selection:text-white">
      <Navbar />

      {/* Enlarged Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative overflow-hidden">
        {/* Subtle geometric background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.03)_0%,transparent_65%)] pointer-events-none" />

        <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-8 relative z-10">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            Standing Multi-Agent Swarm • 500 Resident Students
          </div>

          {/* Enormous Headline with HandwritingText */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.12]">
            Hostel mess operations,
            <br />
            run autonomously
            <br />
            <div className="mt-2">
              <HandwritingText
                words={[
                  "every week of the semester.",
                  "with zero food waste.",
                  "within student budget.",
                  "balanced by ICMR nutrition.",
                  "governed by mess committee."
                ]}
                className="text-white drop-shadow-sm"
                height="1.2em"
              />
            </div>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-zinc-400 max-w-2xl leading-relaxed">
            Not a one-off prompt generator, but a standing operational system. It balances ICMR dietary standards, optimizes wholesale APMC mandi purchasing, prioritizes expiring pantry stock, and halts budget breaches for committee approval.
          </p>

          {/* Key KPI Highlights Bar */}
          <div className="w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 pb-4">
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-left">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
                Weekly Requisition
              </span>
              <div className="text-lg font-bold text-white mt-0.5">₹443,091</div>
              <span className="text-[10px] text-zinc-400">Cap: ₹577,500</span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-left">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
                Daily / Student
              </span>
              <div className="text-lg font-bold text-white mt-0.5">₹126.60</div>
              <span className="text-[10px] text-zinc-400">Limit: ₹165.00/day</span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-left">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
                Protein Floor
              </span>
              <div className="text-lg font-bold text-white mt-0.5">74.2 g/day</div>
              <span className="text-[10px] text-zinc-400">ICMR Min: 68.0g</span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-left">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
                Leftovers Cleared
              </span>
              <div className="text-lg font-bold text-white mt-0.5">107 kg</div>
              <span className="text-[10px] text-zinc-400">Leftover-First Rule</span>
            </div>
          </div>

          {/* Primary Quick Route Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/menu"
              className="px-6 py-3 rounded-xl bg-zinc-100 text-zinc-950 font-semibold text-sm hover:bg-white transition-all shadow-md shadow-zinc-100/10 flex items-center gap-2"
            >
              <Utensils className="w-4 h-4" />
              Explore 7-Day Menu
            </Link>

            <Link
              href="/governance"
              className="px-6 py-3 rounded-xl bg-zinc-900 text-zinc-200 border border-zinc-800 hover:border-zinc-700 hover:text-white font-semibold text-sm transition-all flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Test Budget Breach Gate
            </Link>
          </div>
        </div>

        {/* Modular Navigation Grid */}
        <div className="max-w-6xl mx-auto w-full mt-16 sm:mt-20">
          <div className="text-center mb-8">
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">
              Hostel Operations Modules
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Select a module to view live agent data, debate traces, and governance records
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map((route, idx) => {
              const Icon = route.icon;
              return (
                <Link
                  key={idx}
                  href={route.href}
                  className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-600 hover:bg-zinc-900 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 group-hover:text-white group-hover:border-zinc-700 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono uppercase bg-zinc-950 text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded">
                        {route.badge}
                      </span>
                    </div>

                    <h3 className="font-semibold text-white text-base group-hover:text-zinc-200 flex items-center justify-between">
                      {route.title}
                      <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </h3>

                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                      {route.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
                    <span>Access View</span>
                    <span className="text-zinc-400 group-hover:text-white transition-colors">Launch →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-6 px-4 text-center text-xs text-zinc-500">
        Hostel Mess Operations Agent • Standing Multi-Agent Swarm with ICMR Nutrition & APMC Mandi Governance
      </footer>
    </div>
  );
}
