import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Passway Docs",
  description: "Integrate runtime secret delivery",
};

const nav = [
  ["Introduction", "/docs"],
  ["Quickstart", "/docs/quickstart"],
  ["Node.js SDK", "/docs/sdk/node"],
  ["Next.js SDK", "/docs/sdk/nextjs"],
  ["Errors", "/docs/sdk/errors"],
  ["Security", "/docs/security"],
];

export default function DocsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#1D2633] bg-[#05070A]/90 px-5 backdrop-blur">
        <Link href="/docs" className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="text-blue-400" size={20} />
          Passway <span className="text-[#8B949E]">Docs</span>
        </Link>
        <Link href="/" className="rounded-lg border border-[#1D2633] px-3 py-2 text-sm">
          Home
        </Link>
      </header>
      <div className="mx-auto grid max-w-7xl lg:grid-cols-[230px_1fr]">
        <aside className="hidden min-h-[calc(100vh-4rem)] border-r border-[#1D2633] p-5 lg:block">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#8B949E]">
            <BookOpen size={14} />
            Documentation
          </p>
          <nav className="space-y-1">
            {nav.map(([label, href]) => (
              <Link key={href} href={href} className="block rounded-lg px-3 py-2 text-sm text-[#8B949E] hover:bg-white/5 hover:text-white">
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 px-5 py-12 lg:px-14">{children}</main>
      </div>
    </div>
  );
}
