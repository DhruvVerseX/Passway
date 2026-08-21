import { Activity, Box, CircleHelp, ExternalLink, Gauge, LifeBuoy, LockKeyhole, Menu, Plus, Search, Settings, Users, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { UserMenu } from "@/components/user-menu";

const navigation = [
  { label: "Overview", icon: Gauge, href: "/dashboard" },
  { label: "Secrets", icon: LockKeyhole, href: "/dashboard/secrets", count: "24" },
  { label: "Environments", icon: Box, href: "/dashboard/environments/new" },
  { label: "Access", icon: Users, href: "/dashboard/access" },
  { label: "Audit log", icon: Activity, href: "/dashboard/audit" },
];

const surfaces = [
  { label: "Landing", domain: "passway.co.in" },
  { label: "Docs", domain: "docs.passway.co.in" },
  { label: "API", domain: "api.passway.co.in" },
];

type ControlPlaneShellProps = {
  children: React.ReactNode;
  active?: string;
  title?: string;
  showCreate?: boolean;
};

export function ControlPlaneShell({ children, active = "Overview", title = "Passway Cloud", showCreate = true }: ControlPlaneShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return <div className="min-h-screen bg-[#0b0d0b] text-white selection:bg-[#b9f55d]/25">
    <div className={`fixed inset-0 z-30 bg-black/65 backdrop-blur-sm transition lg:hidden ${sidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setSidebarOpen(false)} aria-hidden="true" />
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-white/[0.07] bg-[#0d0f0c] transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-[68px] items-center gap-3 border-b border-white/[0.065] px-5"><Link href="/dashboard" onClick={() => setSidebarOpen(false)}><img src="/assets/logo/passway-logo-dark.svg" alt="Passway" className="h-8 w-auto" /></Link><span className="rounded border border-white/[0.08] bg-white/[0.035] px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-white/35">BETA</span><button className="ml-auto text-white/35 transition hover:text-white lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={18} /></button></div>
      <div className="p-3"><button className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.075] bg-white/[0.025] p-2 text-left transition hover:bg-white/[0.045]"><img src="/assets/logo/passway-mark-dark.svg" alt="" className="h-7 w-7 shrink-0" aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-white/85">Passway Cloud</span><span className="block text-[10px] text-white/30">Pro workspace</span></span><Settings size={14} className="text-white/30" /></button></div>
      <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Dashboard navigation"><p className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/25">Workspace</p><div className="space-y-0.5">{navigation.map((item) => { const Icon = item.icon; const isActive = item.label === active; return <Link key={item.label} href={item.href} onClick={() => setSidebarOpen(false)} className={`flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-xs font-medium transition ${isActive ? "bg-white/[0.065] text-white" : "text-white/42 hover:bg-white/[0.035] hover:text-white/75"}`}><Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? "text-[#b9f55d]" : ""} />{item.label}{item.count && <span className="ml-auto text-[10px] tabular-nums text-white/25">{item.count}</span>}</Link>; })}</div><p className="mb-2 mt-7 px-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/25">Developer surfaces</p><div className="space-y-0.5">{surfaces.map((surface) => <a key={surface.label} href={`https://${surface.domain}`} className="group flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-xs font-medium text-white/42 transition hover:bg-white/[0.035] hover:text-white/75"><ExternalLink size={14} />{surface.label}<span className="ml-auto text-[10px] text-white/20">↗</span></a>)}</div></nav>
      <div className="flex items-center gap-2 border-t border-white/[0.065] p-3 text-white/35"><LifeBuoy size={14} /><a href="https://docs.passway.co.in" className="text-[10px] hover:text-white/70">Need help? Read the docs</a></div><div className="border-t border-white/[0.065] p-3"><UserMenu direct /></div>
    </aside>
    <div className="lg:pl-[248px]"><header className="sticky top-0 z-20 flex h-[68px] items-center border-b border-white/[0.065] bg-[#0b0d0b]/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8"><button onClick={() => setSidebarOpen(true)} className="mr-3 grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] text-white/55 lg:hidden" aria-label="Open navigation"><Menu size={17} /></button><div className="flex min-w-0 items-center gap-2 text-xs"><span className="hidden text-white/30 sm:inline">Passway Cloud</span><span className="hidden text-white/20 sm:inline">/</span><span className="truncate font-medium text-white/75">{title}</span></div><div className="ml-auto flex items-center gap-2"><button className="hidden h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 text-xs text-white/40 transition hover:bg-white/[0.04] hover:text-white/70 md:flex"><Search size={14} /><span>Search</span><span className="ml-3 rounded border border-white/[0.08] bg-white/[0.035] px-1.5 py-0.5 font-mono text-[9px] text-white/25">⌘ K</span></button><button className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] text-white/40 transition hover:bg-white/[0.04] hover:text-white/70" aria-label="Help"><CircleHelp size={16} /></button>{showCreate && <><Link href="/dashboard/environments/new" className="hidden h-9 items-center gap-2 rounded-lg border border-white/[0.09] px-3 text-xs font-medium text-white/60 transition hover:bg-white/[0.04] hover:text-white sm:inline-flex"><Box size={14} /> New environment</Link><Link href="/dashboard/environments/new" className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#b9f55d] px-3.5 text-xs font-semibold text-[#10130d] transition hover:bg-[#c8ff72] focus:outline-none focus:ring-4 focus:ring-[#b9f55d]/20"><Plus size={14} strokeWidth={2.5} /><span className="hidden sm:inline">Create Environment</span><span className="sm:hidden">Create</span></Link></>}</div></header><main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">{children}</main></div>
  </div>;
}
