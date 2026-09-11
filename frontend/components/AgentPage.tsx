import type { LucideIcon } from "lucide-react";
import Navbar from "@/components/Navbar";

type Item = { title: string; detail: string; status: string };
type AgentPageProps = { eyebrow: string; title: string; description: string; icon: LucideIcon; status: string; items: Item[] };

export default function AgentPage({ eyebrow, title, description, icon: Icon, status, items }: AgentPageProps) {
  return <div className="min-h-screen bg-zinc-950 text-zinc-100"><Navbar /><main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20"><div className="max-w-2xl"><div className="flex items-center gap-3 text-emerald-300"><Icon className="h-5 w-5" aria-hidden="true" /><p className="text-xs font-semibold uppercase tracking-[0.18em]">{eyebrow}</p></div><h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">{title}</h1><p className="mt-4 text-base leading-7 text-zinc-400">{description}</p></div><section className="mt-12 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70"><div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4"><h2 className="font-semibold text-white">Today&apos;s queue</h2><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">{status}</span></div><div className="divide-y divide-zinc-800 px-5">{items.map((item) => <div key={item.title} className="flex items-center justify-between gap-5 py-5"><div><h3 className="text-sm font-medium text-white">{item.title}</h3><p className="mt-1 text-sm text-zinc-400">{item.detail}</p></div><span className="shrink-0 rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300">{item.status}</span></div>)}</div></section></main></div>;
}
