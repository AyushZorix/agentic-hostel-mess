"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [{ href: "/mess", label: "Mess" }, { href: "/rooms", label: "Rooms" }, { href: "/maintenance", label: "Maintenance" }];

export default function Navbar() {
  const pathname = usePathname();
  return <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"><Link href="/" className="text-lg font-bold tracking-tight text-white">Hostel<span className="text-emerald-300">Ops</span></Link><nav className="flex items-center gap-1" aria-label="Primary navigation">{links.map((link) => <Link key={link.href} href={link.href} className={`rounded-lg px-3 py-2 text-sm transition ${pathname === link.href ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}>{link.label}</Link>)}</nav></div></header>;
}
