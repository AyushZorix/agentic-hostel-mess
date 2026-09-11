import Link from "next/link";
import { ArrowRight, BedDouble, UtensilsCrossed, Wrench, Sparkles, CheckCircle2, PhoneCall, ShieldCheck, BarChart3, Users } from "lucide-react";
import Navbar from "@/components/Navbar";

const coreAgents = [
  {
    href: "/mess",
    name: "Mess Operations Agent",
    eyebrow: "Food & Vendor Logistics",
    badge: "Active",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    description: "Generates weekly meal plans, optimizes daily resident budgets, balances nutrition with pantry inventory, and initiates one-click vendor confirmation voice calls via Twilio & ElevenLabs.",
    icon: UtensilsCrossed,
    features: [
      "AI Weekly Menu Generation & Dietary Rules",
      "Dynamic Budget Breakdown (Per Meal & Weekly)",
      "1-Click Twilio + ElevenLabs Vendor Call"
    ],
    statusText: "Menu planned · Budget ₹1,42,500 on track",
    gradient: "from-emerald-500/10 via-zinc-900 to-zinc-950 border-emerald-500/20 hover:border-emerald-500/40"
  },
  {
    href: "/rooms",
    name: "Room Allocation Agent",
    eyebrow: "Resident Admissions & Housing",
    badge: "5 Pending",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    description: "Evaluates student accommodation requests, computes transparent priority scores based on seniority, distance, and medical factors, and autonomously maps students to optimal rooms across Blocks A-D.",
    icon: BedDouble,
    features: [
      "Multi-factor Priority Scoring Engine",
      "Autonomous Block & Room Assignment",
      "Live Occupancy Grid & Audit Logging"
    ],
    statusText: "10 Rooms tracked · 8 Beds Available",
    gradient: "from-blue-500/10 via-zinc-900 to-zinc-950 border-blue-500/20 hover:border-blue-500/40"
  },
  {
    href: "/maintenance",
    name: "Maintenance & Care Agent",
    eyebrow: "Facility & Service Triage",
    badge: "Ready",
    badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    description: "Captures resident issue reports (electrical, plumbing, housekeeping), prioritizes urgent safety concerns, assigns staff work orders, and requires resident validation before closing.",
    icon: Wrench,
    features: [
      "Smart Issue Triage & Safety Escalation",
      "Staff Work Order Assignment",
      "Proof of Work & Resident Validation"
    ],
    statusText: "18 Open Tickets · 0 Critical Breaches",
    gradient: "from-purple-500/10 via-zinc-900 to-zinc-950 border-purple-500/20 hover:border-purple-500/40"
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 flex-1">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Autonomous Standing System</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
            Hostel Operations, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Powered by Autonomous Agents.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            A unified intelligence layer coordinating daily mess menus and budgets with vendor voice confirmation, transparent student room allocation, and rapid maintenance operations.
          </p>
        </div>

        {/* 3 Core Agent Domain Options */}
        <div className="mt-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Core Autonomous Workspaces</h2>
              <p className="text-xs sm:text-sm text-zinc-400">Select an operational domain to run agent workflows</p>
            </div>
            <span className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg">
              3 Modules Active
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {coreAgents.map((agent) => {
              const Icon = agent.icon;
              return (
                <Link
                  key={agent.href}
                  href={agent.href}
                  className={`group relative flex flex-col justify-between rounded-2xl border bg-gradient-to-b ${agent.gradient} p-6 sm:p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-white shadow-inner group-hover:scale-105 transition">
                        <Icon className="h-6 w-6 text-emerald-400" />
                      </div>
                      <span className={`text-[11px] font-semibold border px-2.5 py-0.5 rounded-full ${agent.badgeColor}`}>
                        {agent.badge}
                      </span>
                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        {agent.eyebrow}
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-white group-hover:text-emerald-300 transition">
                        {agent.name}
                      </h3>
                      <p className="mt-3 text-xs sm:text-sm leading-relaxed text-zinc-400">
                        {agent.description}
                      </p>
                    </div>

                    <div className="mt-6 space-y-2 border-t border-zinc-800/80 pt-4">
                      {agent.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-zinc-800/60 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-400">
                      {agent.statusText}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition">
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Global Operations System Overview */}
        <section className="mt-16 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Resident Population</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-1">500</p>
              <p className="text-[11px] text-emerald-400 mt-1">Full Mess Capacity</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Weekly Mess Budget</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-1">₹1,50,000</p>
              <p className="text-[11px] text-emerald-400 mt-1">Target ₹1,42,500 (Savings)</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Hostel Room Beds</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-1">10 / 18</p>
              <p className="text-[11px] text-blue-400 mt-1">8 Beds Available</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Vendor AI Voice</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-1">Twilio + 11Labs</p>
              <p className="text-[11px] text-purple-400 mt-1">1-Click Dispatch Ready</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        <p>HostelOps Autonomous Multi-Agent Management Platform · Mess, Rooms & Maintenance</p>
      </footer>
    </div>
  );
}
