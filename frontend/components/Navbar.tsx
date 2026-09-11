"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, BedDouble, Wrench, Home, Bot } from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/mess", label: "Mess Agent", icon: UtensilsCrossed },
  { href: "/rooms", label: "Room Allocation", icon: BedDouble },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:border-emerald-400 transition">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">
                Hostel<span className="text-emerald-400">Ops</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                Multi-Agent Platform
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Primary navigation">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition ${
                  isActive
                    ? "bg-zinc-800/90 text-white shadow-sm border border-zinc-700"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-zinc-400"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 px-2.5 py-1 rounded-full">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Agent Swarm Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}
