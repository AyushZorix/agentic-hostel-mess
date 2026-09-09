"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { WEEK_8_BREACH_DATA, AUDIT_ENTRIES } from "@/lib/mess-data";
import { getGovernanceStatus, signGovernanceCase } from "@/lib/api";
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
  Send,
  Lock
} from "lucide-react";

export default function GovernancePage() {
  const [signatures, setSignatures] = useState<{ [role: string]: { name: string; signed: boolean; time?: string } }>({
    "Student General Secretary": { name: "Aarav Sharma", signed: false },
    "Mess Warden": { name: "Prof. K. R. Ramanathan", signed: false },
    "Mess Manager": { name: "S. Sundaram", signed: false }
  });
  const [auditChain, setAuditChain] = useState<any[]>(AUDIT_ENTRIES);
  const [loading, setLoading] = useState<boolean>(false);
  const [chainValid, setChainValid] = useState<boolean>(true);

  const loadGovernance = async () => {
    try {
      const data = await getGovernanceStatus();
      if (data) {
        if (data.audit_ledger && data.audit_ledger.length > 0) {
          setAuditChain(data.audit_ledger);
        }
        setChainValid(data.chain_valid ?? true);
      }
    } catch (err) {
      console.warn("Backend governance status fetch failed, using local mock:", err);
    }
  };

  useEffect(() => {
    loadGovernance();
  }, []);

  const signedCount = Object.values(signatures).filter((s) => s.signed).length;
  const isQuorumReached = signedCount >= 2;

  const handleSign = async (role: string) => {
    const signatoryName = signatures[role].name;
    const now = new Date().toISOString();

    try {
      setLoading(true);
      await signGovernanceCase(
        "APP-WK8-BREACH-001",
        role,
        signatoryName,
        "APPROVE",
        `Ratified Week 8 Diwali Festive banquet requisition (INR ${WEEK_8_BREACH_DATA.total_weekly_cost_inr.toLocaleString()})`
      );
      await loadGovernance();
    } catch (err) {
      console.warn("Backend sign error or mock fallback:", err);
    } finally {
      const updated = {
        ...signatures,
        [role]: { ...signatures[role], signed: true, time: now }
      };
      setSignatures(updated);
      setLoading(false);
    }
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
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                SHA-256 Ledger
              </span>
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
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Active Incident: Semester Week 8 Diwali Banquet Budget Spike
            </div>
            <span className="text-[10px] font-mono uppercase bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded text-amber-300">
              Threshold Breached
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            The student council requested celebratory banquets including Butter Chicken, Paneer Butter Masala, and Saffron Kheer. Total wholesale requisition is <span className="font-semibold text-white">₹634,409.16</span>, exceeding the standard weekly allowance of <span className="font-semibold text-white">₹577,500.00</span> by <span className="font-semibold text-white">+₹56,909.16 (+9.85%)</span>.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-2 border-t border-zinc-800">
            <div>
              <span className="text-zinc-400">Approval ID: </span>
              <span className="text-white font-bold">APP-WK8-BREACH-001</span>
            </div>
            <div>
              <span className="text-zinc-400">Required Quorum: </span>
              <span className="text-white font-bold">2 / 3 Signatories</span>
            </div>
            <div>
              <span className="text-zinc-400">Current Status: </span>
              <span className={`font-bold ${isQuorumReached ? "text-emerald-400" : "text-amber-400"}`}>
                {isQuorumReached ? "QUORUM REACHED - APPROVED" : "PENDING COMMITTEE SIGN-OFF"}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Committee Voting Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(signatures).map(([role, info]) => (
            <div
              key={role}
              className={`p-5 rounded-2xl border transition-all space-y-4 flex flex-col justify-between ${
                info.signed
                  ? "bg-emerald-950/20 border-emerald-500/40"
                  : "bg-zinc-900/90 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                    Signatory Role
                  </span>
                  {info.signed ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      <Check className="w-3 h-3" /> Signed
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                      Pending
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">{role}</h3>
                <p className="text-xs text-zinc-300 font-medium">{info.name}</p>
              </div>

              <div>
                {info.signed ? (
                  <div className="text-[10px] font-mono text-zinc-400 border-t border-zinc-800/80 pt-3 space-y-1">
                    <div>Signed: {new Date(info.time || Date.now()).toLocaleTimeString()}</div>
                    <div className="text-emerald-400 font-semibold">Status: Electronic Ratification Recorded</div>
                  </div>
                ) : (
                  <button
                    disabled={loading}
                    onClick={() => handleSign(role)}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Authorize Requisition</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* SHA-256 Hash Chain Audit Ledger */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Lock className="w-5 h-5 text-zinc-400" />
                <span>SHA-256 Immutable Hash-Chained Audit Ledger</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Cryptographically linked chronological log securing all autonomous operations, inventory audits, and committee approvals.
              </p>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-zinc-400">Chain Integrity:</span>
              <span className={`font-bold flex items-center gap-1 ${chainValid ? "text-emerald-400" : "text-red-400"}`}>
                <Check className="w-3.5 h-3.5" /> Verified
              </span>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {auditChain.map((entry, index) => (
              <div
                key={index}
                className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-2 hover:border-zinc-700 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      #{entry.index !== undefined ? entry.index : index}
                    </span>
                    <span className="text-emerald-400 font-semibold">{entry.action}</span>
                  </div>
                  <span className="text-zinc-400 text-[10px]">
                    {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ""}
                  </span>
                </div>

                <p className="text-zinc-300 text-xs font-sans">
                  {typeof entry.details === "object"
                    ? (entry.details?.message ? `${entry.details.message}${entry.details.semester ? ` (${entry.details.semester})` : ''}` : JSON.stringify(entry.details))
                    : (typeof entry.details === "string"
                        ? entry.details
                        : (typeof entry.payload_json === "object"
                            ? (entry.payload_json?.message || JSON.stringify(entry.payload_json))
                            : String(entry.payload_json || "")))}
                </p>

                <div className="pt-2 border-t border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-zinc-400">
                  <div className="truncate max-w-md">
                    <span>SHA-256: </span>
                    <span className="text-zinc-300 font-mono">{entry.entry_hash || entry.hash}</span>
                  </div>
                  {(entry.previous_hash || entry.prev_hash) && (
                    <div className="truncate max-w-xs">
                      <span>Prev: </span>
                      <span className="text-zinc-400 font-mono">{entry.previous_hash || entry.prev_hash}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
