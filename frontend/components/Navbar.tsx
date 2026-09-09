"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Utensils,
  Shield,
  Layers,
  Cpu,
  Database,
  FileText,
  Home as HomeIcon
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Home", icon: HomeIcon },
    { href: "/menu", label: "Weekly Menu", icon: Utensils },
    { href: "/swarm", label: "Swarm Debate", icon: Cpu },
    { href: "/governance", label: "Governance Gate", icon: Shield },
    { href: "/pantry", label: "Pantry & Leftovers", icon: Layers },
    { href: "/mcp", label: "MCP Tools", icon: Database },
    { href: "/docs", label: "Deliverables", icon: FileText }
  ];

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center font-mono text-sm font-bold text-white group-hover:border-zinc-500 transition-colors shadow-sm">
            HM
          </div>
          <div>
            <span className="font-semibold text-sm tracking-tight text-white group-hover:text-zinc-300 transition-colors">
              Hostel Mess Operations Agent
            </span>
            <span className="hidden sm:inline-block text-xs text-zinc-500 ml-2 border-l border-zinc-800 pl-2">
              Autonomous Standing System
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-zinc-100 text-zinc-950 font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile/Quick Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono">500 Residents</span>
          </div>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="lg:hidden flex overflow-x-auto gap-1 px-4 py-2 border-t border-zinc-900 bg-zinc-950 scrollbar-none">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-zinc-100 text-zinc-950 font-bold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <Icon className="w-3 h-3" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
