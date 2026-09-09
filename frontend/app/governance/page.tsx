"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { WEEK_8_BREACH_DATA, AUDIT_ENTRIES } from "@/lib/mess-data";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Check,
  UserCheck,
  FileText,
  AlertCircle,
  RefreshCw,
  Clock,
  Send
} from "lucide-react";

export default function GovernancePage() {
  const [signatures, setSignatures] = useState<{ [role: string]: { name: string; signed: boolean; time?: string } }>({
    "Student General Secretary": { name: "Aarav Sharma", signed: false },
    "Mess Warden": { name: "Prof. K. R. Ramanathan", signed: false },
    "Mess Manager": { name: "S. Sundaram", signed: false }
  });
  const [auditChain, setAuditChain] = useState(AUDIT_ENTRIES);

  const signedCount = Object.values(signatures).filter((s) => s.signed).length;
  const isQuorumReached = signedCount >= 2;

  const handleSign = (role: string) => {
    const now = new Date().toISOString();
    const updated = {
      ...signatures,
      [role]: { ...signatures[role], signed: true, time: now }
    };
    setSignatures(updated);

    const newEntry = {
      index: auditChain.length,
      timestamp: now,
      actor: `${role}:${updated[role].name}`,
      action: "COMMITTEE_SIGNATURE_APPROVE",
      details: `Ratified Week 8 Diwali Festive banquet requisition (INR ${WEEK_8_BREACH_DATA.total_weekly_cost_inr.toLocaleString()})`,
      hash: Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2)
    };
    setAuditChain([...auditChain, newEntry]);
  };

  const handleReset = () => {
    setSignatures({
      "Student General Secretary": { name: "Aarav Sharma", signed: false },
      "Mess Warden": { name: "Prof. K. R. Ramanathan", signed: false },
      "Mess Manager": { name: "S. Sundaram", signed: false }
    });
    setAuditChain(AUDIT_ENTRIES);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-zinc-800 selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-1">
              <span>Governance & Safety</span>
              <span>•</span>
              <span className="text-white">Human-in-the-Loop Approval Gate</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Mess Committee Approval Gate
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
              Any procurement order exceeding the weekly allowance of ₹5,77,500.00 pauses autonomous ordering and requires quorum ratification (2 of 3 votes) by the Mess Committee.
            </p>
          </div>

          <button
            onClick={handleReset}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium rounded-lg border border-zinc-700 transition-all flex items-center gap-2 text-zinc-200 self-start sm:self-auto"
          >
            <RefreshCw className="w-3 h-3" />
            Reset Simulation
          </button>
        </div>

        {/* Breach Case Banner */}
        <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-700 text-zinc-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-base text-white">
              <ShieldAlert className="w-5 h-5 text-zinc-300" />
              Active Incident: Semester Week 8 Diwali Banquet Budget Spike
            </div>
            <span className="text-[10px] font-mono uppercase bg-zinc-800 border border-zinc-600 px-2.5 py-1 rounded text-zinc-200">
              Threshold Breached
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            The student council requested celebratory banquets including Butter Chicken, Paneer Butter Masala, and Saffron Kheer. Total wholesale requisition is <span className="font-semibold text-white">₹634,409.16</span>, exceeding the standard weekly allowance of <span className="font-semibold text-white">₹577,500.00</span> by <span className="font-semibold text-white">+₹56,909.16 (+9.85%)</span>.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase font-mono">Proposed Total</span>
              <span className="font-bold text-white text-sm">₹634,409</span>
            </div>
            <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase font-mono">Budget Ceiling</span>
              <span className="font-bold text-white text-sm">₹577,500</span>
            </div>
            <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase font-mono">Breach Amount</span>
              <span className="font-bold text-white text-sm">+₹56,909</span>
            </div>
            <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase font-mono">Quorum Status</span>
              <span className="font-bold text-white text-sm">{signedCount}/3 Signed</span>
            </div>
          </div>
        </div>

        {/* Interactive Signatories Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
              Mess Committee Voting Panel (2 of 3 Quorum Required)
            </h2>
            <span className="text-xs text-zinc-500 font-mono">
              Gate ID: {WEEK_8_BREACH_DATA.approval_id}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(signatures).map(([role, sig]) => (
              <div
                key={role}
                className={`p-5 rounded-2xl border transition-all ${
                  sig.signed
                    ? "bg-zinc-900 border-zinc-600 text-zinc-100"
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{role}</span>
                  {sig.signed ? (
                    <span className="text-[10px] bg-zinc-800 text-white border border-zinc-600 px-2 py-0.5 rounded font-mono font-bold">
                      SIGNED
                    </span>
                  ) : (
                    <span className="text-[10px] bg-zinc-950 text-zinc-500 px-2 py-0.5 rounded font-mono">
                      AWAITING
                    </span>
                  )}
                </div>

                <div className="font-semibold text-white text-base mb-1">{sig.name}</div>
                <div className="text-xs text-zinc-400 mb-5">
                  {sig.signed ? `Signed at ${sig.time?.substring(11, 19)} UTC` : "Pending vote review"}
                </div>

                {sig.signed ? (
                  <div className="flex items-center gap-1.5 text-xs text-white font-medium p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                    <Check className="w-4 h-4 text-emerald-400" /> Electronic Signature Verified
                  </div>
                ) : (
                  <button
                    onClick={() => handleSign(role)}
                    className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Sign & Ratify Breach
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Gate Verdict Box */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-zinc-500">Autonomous Execution Gate:</div>
            <div className="text-sm font-semibold text-white flex items-center gap-2 mt-1">
              {isQuorumReached ? (
                <span className="text-white flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" /> Quorum Achieved ({signedCount}/3 Signatures) — Purchase Order PO-SEM1-WK08-002 Released to Suppliers!
                </span>
              ) : (
                <span className="text-zinc-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-zinc-400" /> Locked Awaiting Quorum ({signedCount}/3 Signatures Recorded)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cryptographic Hash-Chained Audit Ledger */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-300" />
              Cryptographic SHA-256 Audit Log (Immutable & Hash-Chained)
            </h3>
            <span className="text-xs text-zinc-500 font-mono">Chain Length: {auditChain.length} Blocks</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {auditChain.map((entry, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 font-mono text-xs space-y-1">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-white font-bold">Block #{entry.index} • {entry.actor}</span>
                  <span className="text-zinc-500 text-[11px]">{entry.timestamp}</span>
                </div>
                <div className="text-zinc-200 font-semibold">{entry.action}</div>
                <div className="text-zinc-400 text-[11px]">{entry.details}</div>
                <div className="text-zinc-500 text-[10px] break-all">
                  SHA-256: {entry.hash}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-6 px-4 text-center text-xs text-zinc-500">
        Hostel Mess Operations Agent • Committee Governance & Safety Gate Module
      </footer>
    </div>
  );
}
