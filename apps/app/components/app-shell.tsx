import Link from "next/link";
import { Bell, Blocks, ChevronsUpDown, CircleUserRound, FolderKanban, LayoutDashboard, LifeBuoy, Settings, ShieldCheck } from "lucide-react";

const nav=[[LayoutDashboard,"Overview","/dashboard"],[FolderKanban,"Projects","/projects"],[Blocks,"Integrations","#"],[Settings,"Workspace settings","#"]];
export function AppShell({children}:Readonly<{children:React.ReactNode}>) {
  return <div className="min-h-screen bg-[#05070A] lg:grid lg:grid-cols-[240px_1fr]">
    <aside className="hidden border-r border-[#1D2633] bg-[#080B10] lg:flex lg:flex-col">
      <Link href="/dashboard" className="flex h-16 items-center gap-2 border-b border-[#1D2633] px-5 font-semibold"><span className="grid size-8 place-items-center rounded-lg bg-blue-500/10 text-blue-400"><ShieldCheck size={18}/></span>Passway</Link>
      <div className="p-3"><button className="flex w-full items-center gap-3 rounded-lg border border-[#1D2633] bg-[#0B0F14] p-3 text-left text-sm"><span className="grid size-7 place-items-center rounded-md bg-blue-500 text-xs font-bold">PW</span><span className="min-w-0 flex-1"><b className="block truncate">Passway workspace</b><span className="text-xs text-[#8B949E]">Developer plan</span></span><ChevronsUpDown size={14} className="text-[#8B949E]"/></button></div>
      <nav className="space-y-1 px-3">{nav.map(([Icon,label,href])=>{const C=Icon as typeof LayoutDashboard;return <Link key={label as string} href={href as string} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#8B949E] hover:bg-white/5 hover:text-white"><C size={17}/>{label as string}</Link>})}</nav>
      <div className="mt-auto border-t border-[#1D2633] p-3"><a href="https://docs.passway.co.in" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#8B949E]"><LifeBuoy size={17}/>Documentation</a></div>
    </aside>
    <div className="min-w-0"><header className="flex h-16 items-center justify-between border-b border-[#1D2633] px-5 lg:px-8"><div className="flex items-center gap-2 font-semibold lg:hidden"><ShieldCheck className="text-blue-400" size={20}/>Passway</div><span className="hidden text-sm text-[#8B949E] lg:block">Workspace / <span className="text-[#E6EDF3]">Passway</span></span><div className="flex items-center gap-2"><button className="grid size-9 place-items-center rounded-lg text-[#8B949E] hover:bg-white/5" aria-label="Notifications"><Bell size={18}/></button><button className="grid size-9 place-items-center rounded-lg text-[#8B949E]" aria-label="Account menu"><CircleUserRound size={20}/></button></div></header><main className="p-5 lg:p-8">{children}</main></div>
  </div>;
}
