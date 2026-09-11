import Link from "next/link";
import { ArrowRight, BedDouble, UtensilsCrossed, Wrench } from "lucide-react";
import Navbar from "@/components/Navbar";

const agents = [
  { href: "/mess", name: "Mess agent", description: "Plan tomorrow's meals, use pantry stock first, and keep every order ready for approval.", icon: UtensilsCrossed, status: "Tomorrow on track" },
  { href: "/rooms", name: "Room allocation agent", description: "Make room offers fair, easy to understand, and ready for warden review.", icon: BedDouble, status: "13 reviews pending" },
  { href: "/maintenance", name: "Maintenance agent", description: "Turn resident issues into clear work orders and confirm the fix with the resident.", icon: Wrench, status: "18 open requests" },
];

export default function Home() {
  return <div className="min-h-screen bg-zinc-950 text-zinc-100"><Navbar /><main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">HostelOps</p><h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-6xl">Hostel operations, without the chaos.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">Choose an agent to manage meals, rooms, or everyday maintenance.</p><section className="mt-12 grid gap-4 md:grid-cols-3" aria-label="Hostel operations agents">{agents.map((agent) => { const Icon = agent.icon; return <Link key={agent.href} href={agent.href} className="group rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 transition hover:border-emerald-400/50 hover:bg-zinc-900"><Icon className="h-6 w-6 text-emerald-300" aria-hidden="true" /><h2 className="mt-6 flex items-center justify-between text-lg font-semibold text-white">{agent.name}<ArrowRight className="h-4 w-4 text-zinc-500 transition group-hover:translate-x-1 group-hover:text-white" /></h2><p className="mt-2 text-sm leading-6 text-zinc-400">{agent.description}</p><p className="mt-6 text-xs font-medium text-emerald-300">{agent.status}</p></Link>; })}</section></main></div>;
}
