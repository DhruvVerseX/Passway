import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#1D2633]/80 bg-[#05070A]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400"><ShieldCheck size={17} /></span>
          Passway <span className="text-[#8B949E]">EnvVault</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-[#8B949E] md:flex">
          <Link href="/security">Security</Link><Link href="/pricing">Pricing</Link>
          <a href="https://docs.passway.co.in">Docs</a>
        </nav>
        <a href="https://app.passway.co.in/signup" className="rounded-lg bg-[#E6EDF3] px-4 py-2 text-sm font-semibold text-[#05070A]">Start free</a>
      </div>
    </header>
  );
}
