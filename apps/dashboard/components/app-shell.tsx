import Link from "next/link";
import { Bell, Blocks, ChevronsUpDown, FolderKanban, LayoutDashboard, LifeBuoy, Settings } from "lucide-react";
import { UserMenu } from "@/components/user-menu";

const nav = [[LayoutDashboard, "Overview", "/dashboard"], [FolderKanban, "Projects", "/projects"], [Blocks, "Integrations", "#"], [Settings, "Workspace settings", "#"]] as const;

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function AppShell({ children, user }: Readonly<{ children: React.ReactNode; user?: User | null }>) {
  return (
    <div className="min-h-screen bg-[#05070A] lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-[#1D2633] bg-[#080B10] lg:flex lg:flex-col">
        <Link href="/dashboard" className="flex h-16 items-center gap-2 border-b border-[#1D2633] px-5 font-semibold"><img src="/assets/logo/passway-logo-dark.svg" alt="Passway" className="h-8 w-auto" /></Link>
        <div className="p-3"><button className="flex w-full items-center gap-3 rounded-lg border border-[#1D2633] bg-[#0B0F14] p-3 text-left text-sm"><img src="/assets/logo/passway-mark-dark.svg" alt="" className="size-7 shrink-0" aria-hidden="true" /><span className="min-w-0 flex-1"><b className="block truncate">Passway workspace</b><span className="text-xs text-[#8B949E]">Developer plan</span></span><ChevronsUpDown size={14} className="text-[#8B949E]" /></button></div>
        <nav className="space-y-1 px-3">{nav.map(([Icon, label, href]) => <Link key={label} href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#8B949E] hover:bg-white/5 hover:text-white"><Icon size={17} />{label}</Link>)}</nav>
        <div className="mt-auto border-t border-[#1D2633] p-3"><a href="/docs" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#8B949E]"><LifeBuoy size={17} />Documentation</a></div>
      </aside>
      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-[#1D2633] px-5 lg:px-8">
          <div className="flex items-center gap-2 font-semibold lg:hidden"><img src="/assets/logo/passway-logo-dark.svg" alt="Passway" className="h-8 w-auto" /></div>
          <span className="hidden text-sm text-[#8B949E] lg:block">Workspace / <span className="text-[#E6EDF3]">Passway</span></span>
          <div className="flex items-center gap-2"><button className="grid size-9 place-items-center rounded-lg text-[#8B949E] hover:bg-white/5" aria-label="Notifications"><Bell size={18} /></button><UserMenu user={user} /></div>
        </header>
        <main className="p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
