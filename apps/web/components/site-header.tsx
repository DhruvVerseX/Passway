import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#1D2633]/80 bg-[#05070A]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center">
          <img src="/assets/logo/passway-logo-dark.svg" alt="Passway" className="h-8 w-auto" />
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-[#8B949E] md:flex">
          <Link href="/security">Security</Link><Link href="/pricing">Pricing</Link>
          <Link href="/docs">Docs</Link>
        </nav>
        <a href="https://app.passway.co.in/signup" className="rounded-lg bg-[#E6EDF3] px-4 py-2 text-sm font-semibold text-[#05070A]">Start free</a>
      </div>
    </header>
  );
}
