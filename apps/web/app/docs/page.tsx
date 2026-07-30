"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clipboard,
  Code2,
  ExternalLink,
  FileCode2,
  Github,
  KeyRound,
  LockKeyhole,
  Menu,
  Package,
  Search,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

const navigation = [
  {
    label: "Get started",
    items: [
      ["Introduction", "introduction"],
      ["Installation", "installation"],
      ["Quick start", "quick-start"],
    ],
  },
  {
    label: "Core concepts",
    items: [
      ["Environments", "environments"],
      ["SDK keys", "sdk-keys"],
      ["Secret resolution", "secret-resolution"],
    ],
  },
  {
    label: "SDK reference",
    items: [
      ["passway.load()", "load"],
      ["Configuration", "configuration"],
      ["Error handling", "errors"],
    ],
  },
];

const snippets = {
  install: "bun add @passway/sdk",
  env: "PASSWAY_KEY=pw_live_your_scoped_key",
  quick: `import { passway } from "@passway/sdk";

const env = await passway.load();

const database = connect(env.DATABASE_URL);
const stripe = new Stripe(env.STRIPE_SECRET_KEY);`,
};

function PasswayMark() {
  return <img src="/assets/logo/passway-mark-dark.svg" alt="" className="h-8 w-8 shrink-0" aria-hidden="true" />;
}

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard access can be unavailable in an embedded preview.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] text-white/35 transition hover:bg-white/[0.05] hover:text-white/70"
      aria-label={`Copy ${label.toLowerCase()}`}
    >
      {copied ? <Check size={12} className="text-[#b9f55d]" /> : <Clipboard size={11} />}
      {copied ? "Copied" : label}
    </button>
  );
}

function CodeBlock({
  title,
  code,
  children,
}: {
  title: string;
  code: string;
  children: React.ReactNode;
}) {
  return (
    <div className="my-6 overflow-hidden rounded-xl border border-white/[0.075] bg-[#090b09] shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
      <div className="flex h-10 items-center border-b border-white/[0.06] px-3.5">
        <div className="flex items-center gap-2 text-[10px] text-white/30">
          <FileCode2 size={12} />
          {title}
        </div>
        <div className="ml-auto">
          <CopyButton value={code} />
        </div>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[12px] leading-7 text-white/72 sm:p-6 sm:text-[13px]">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function DocsNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Documentation navigation" className="space-y-7">
      {navigation.map((group) => (
        <div key={group.label}>
          <p suppressHydrationWarning className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/22">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map(([label, id], index) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={onNavigate}
                className={`flex h-8 items-center rounded-lg px-2.5 text-[12px] transition hover:bg-white/[0.04] hover:text-white/75 ${
                  group.label === "Get started" && index === 0
                    ? "bg-[#b9f55d]/[0.07] font-medium text-[#cdf98a]"
                    : "text-white/38"
                }`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function PasswayDocs() {
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileNav ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNav]);

  return (
    <div className="min-h-screen bg-[#0b0d0b] text-white selection:bg-[#b9f55d]/25">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.065] bg-[#0b0d0b]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2.5" aria-label="Passway home">
            <img src="/assets/logo/passway-logo-dark.svg" alt="Passway" className="h-8 w-auto" />
          </a>
          <div className="mx-4 hidden h-5 w-px bg-white/[0.09] sm:block" />
          <span className="hidden text-[12px] font-medium text-white/40 sm:block">Documentation</span>

          <button className="ml-auto hidden h-9 w-full max-w-[270px] items-center gap-2 rounded-lg border border-white/[0.075] bg-white/[0.025] px-3 text-left text-[11px] text-white/27 transition hover:border-white/[0.12] md:flex">
            <Search size={13} />
            Search documentation
            <span className="ml-auto rounded border border-white/[0.08] px-1.5 py-0.5 font-mono text-[9px]">⌘ K</span>
          </button>

          <div className="ml-auto flex items-center gap-1.5 md:ml-4">
            <a href="https://github.com" aria-label="GitHub" className="grid h-9 w-9 place-items-center rounded-lg text-white/35 transition hover:bg-white/[0.04] hover:text-white/70">
              <Github size={15} />
            </a>
            <a href="https://app.passway.co.in" className="hidden h-9 items-center gap-1.5 rounded-lg bg-[#b9f55d] px-3.5 text-[11px] font-semibold text-[#10130d] transition hover:bg-[#c8ff72] sm:inline-flex">
              Dashboard <ArrowRight size={12} />
            </a>
            <button onClick={() => setMobileNav(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.075] text-white/55 lg:hidden" aria-label="Open documentation navigation">
              <Menu size={17} />
            </button>
          </div>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-16 hidden w-[250px] border-r border-white/[0.065] bg-[#0b0d0b] px-5 py-8 lg:block">
        <DocsNav />
        <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-[#b9f55d]/12 bg-[#b9f55d]/[0.04] p-3.5">
          <p suppressHydrationWarning className="text-[11px] font-medium text-white/70">Need help?</p>
          <p suppressHydrationWarning className="mt-1 text-[10px] leading-4 text-white/30">Talk to us if you get stuck integrating Passway.</p>
          <a href="mailto:support@passway.co.in" className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-[#b9f55d]/80">
            Contact support <ArrowRight size={10} />
          </a>
        </div>
      </aside>

      <div className={`fixed inset-0 z-[60] bg-[#0b0d0b] transition duration-300 lg:hidden ${mobileNav ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}>
        <div className="flex h-16 items-center border-b border-white/[0.065] px-4">
          <PasswayMark />
          <span className="ml-2.5 text-sm font-semibold">Documentation</span>
          <button onClick={() => setMobileNav(false)} className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] text-white/55" aria-label="Close documentation navigation">
            <X size={17} />
          </button>
        </div>
        <div className="h-[calc(100vh-64px)] overflow-y-auto px-5 py-7">
          <DocsNav onNavigate={() => setMobileNav(false)} />
        </div>
      </div>

      <main className="pt-16 lg:pl-[250px] xl:pr-[220px]">
        <div className="mx-auto max-w-[850px] px-5 py-14 sm:px-10 sm:py-20">
          <div className="mb-8 flex items-center gap-2 text-[10px] text-white/25">
            <a href="/" className="transition hover:text-white/60">Passway</a>
            <span>/</span>
            <span className="text-white/50">Documentation</span>
          </div>

          <section id="introduction" className="scroll-mt-24">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#b9f55d]/15 bg-[#b9f55d]/[0.05] px-3 py-1.5 text-[10px] font-medium text-[#cef98b]">
              <Zap size={11} /> SDK v0.1
            </div>
            <h1 className="mt-5 text-[42px] font-semibold leading-[1.02] tracking-[-0.055em] text-[#f6f7f4] sm:text-[58px]">
              Passway documentation
            </h1>
            <p suppressHydrationWarning className="mt-5 max-w-2xl text-[15px] leading-7 text-white/43 sm:text-base">
              Securely deliver encrypted secrets to your applications at runtime. No environment files in Git, no credentials copied between dashboards, and no painful rotation process.
            </p>

            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {[
                [Package, "Install the SDK", "One lightweight package", "installation"],
                [KeyRound, "Create a key", "Scoped per environment", "sdk-keys"],
                [LockKeyhole, "Load secrets", "Resolved only at runtime", "quick-start"],
              ].map(([Icon, title, copy, href]) => {
                const ItemIcon = Icon as typeof Package;
                return (
                  <a key={String(title)} href={`#${String(href)}`} className="group rounded-xl border border-white/[0.07] bg-white/[0.018] p-4 transition hover:border-[#b9f55d]/15 hover:bg-[#b9f55d]/[0.025]">
                    <ItemIcon size={17} className="text-[#b9f55d]/75" />
                    <p suppressHydrationWarning className="mt-5 text-[12px] font-medium text-white/72">{String(title)}</p>
                    <p suppressHydrationWarning className="mt-1 text-[10px] text-white/28">{String(copy)}</p>
                  </a>
                );
              })}
            </div>
          </section>

          <div className="my-14 h-px bg-white/[0.065]" />

          <section id="installation" className="scroll-mt-24">
            <p suppressHydrationWarning className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#b9f55d]/70">Get started</p>
            <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.04em]">Installation</h2>
            <p suppressHydrationWarning className="mt-3 text-sm leading-7 text-white/40">
              Install the Passway SDK in your Node.js, Bun, Next.js, or Hono application.
            </p>
            <CodeBlock title="Terminal" code={snippets.install}>
              <span className="text-white/25">$ </span>
              <span className="text-[#b9f55d]">bun add</span>
              <span> @passway/sdk</span>
            </CodeBlock>
            <div className="rounded-xl border border-amber-300/10 bg-amber-300/[0.035] p-4">
              <p suppressHydrationWarning className="text-[11px] font-medium text-amber-100/70">Server-side only</p>
              <p suppressHydrationWarning className="mt-1.5 text-[11px] leading-5 text-white/32">
                Never import the SDK into client components or expose a Passway SDK key to the browser.
              </p>
            </div>
          </section>

          <section id="quick-start" className="mt-16 scroll-mt-24">
            <h2 className="text-[28px] font-semibold tracking-[-0.04em]">Quick start</h2>
            <p suppressHydrationWarning className="mt-3 text-sm leading-7 text-white/40">
              Create a scoped key in the Passway dashboard, add it to your deployment environment, and load your secrets before initializing dependent services.
            </p>

            <div className="mt-7 flex gap-4">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#b9f55d]/18 bg-[#b9f55d]/[0.055] font-mono text-[10px] text-[#b9f55d]">1</span>
              <div>
                <h3 className="text-[14px] font-medium text-white/78">Add your SDK key</h3>
                <p suppressHydrationWarning className="mt-1.5 text-[12px] leading-6 text-white/35">Keep this value in your hosting provider—not in source control.</p>
              </div>
            </div>
            <CodeBlock title=".env" code={snippets.env}>
              <span className="text-sky-200">PASSWAY_KEY</span>
              <span className="text-white/35">=</span>
              <span className="text-emerald-200">pw_live_your_scoped_key</span>
            </CodeBlock>

            <div className="mt-7 flex gap-4">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#b9f55d]/18 bg-[#b9f55d]/[0.055] font-mono text-[10px] text-[#b9f55d]">2</span>
              <div>
                <h3 className="text-[14px] font-medium text-white/78">Load secrets at startup</h3>
                <p suppressHydrationWarning className="mt-1.5 text-[12px] leading-6 text-white/35">Passway authenticates the runtime and returns only the secrets granted to this key.</p>
              </div>
            </div>
            <CodeBlock title="server.ts" code={snippets.quick}>
              <span className="text-violet-300">import</span> {"{ passway }"} <span className="text-violet-300">from</span> <span className="text-emerald-200">&quot;@passway/sdk&quot;</span>;{"\n\n"}
              <span className="text-violet-300">const</span> env = <span className="text-violet-300">await</span> passway.load();{"\n\n"}
              <span className="text-white/25">{"// Use typed values without exposing them in source."}</span>{"\n"}
              <span className="text-violet-300">const</span> database = connect(env.DATABASE_URL);{"\n"}
              <span className="text-violet-300">const</span> stripe = <span className="text-violet-300">new</span> Stripe(env.STRIPE_SECRET_KEY);
            </CodeBlock>
          </section>

          <section id="environments" className="mt-16 scroll-mt-24">
            <h2 className="text-[28px] font-semibold tracking-[-0.04em]">Core concepts</h2>
            <div className="mt-7 overflow-hidden rounded-xl border border-white/[0.07]">
              {[
                [Code2, "Environments", "Keep development, preview, and production secrets isolated. Each SDK key can resolve values from exactly one environment."],
                [KeyRound, "Scoped SDK keys", "Grant each application the minimum access it needs. Revoke or rotate a key without changing your stored secrets."],
                [ShieldCheck, "Secret resolution", "Values are decrypted only for an authenticated request and are never written to application logs by the SDK."],
              ].map(([Icon, title, copy], index) => {
                const ItemIcon = Icon as typeof Code2;
                return (
                  <div id={index === 1 ? "sdk-keys" : index === 2 ? "secret-resolution" : undefined} key={String(title)} className="flex gap-4 border-b border-white/[0.06] p-5 last:border-0">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.035] text-[#b9f55d]/70"><ItemIcon size={16} /></span>
                    <div>
                      <h3 className="text-[13px] font-medium text-white/75">{String(title)}</h3>
                      <p suppressHydrationWarning className="mt-1.5 text-[12px] leading-6 text-white/34">{String(copy)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section id="load" className="mt-16 scroll-mt-24">
            <h2 className="text-[28px] font-semibold tracking-[-0.04em]">SDK reference</h2>
            <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.018] p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-md bg-violet-300/10 px-2 py-1 font-mono text-[10px] text-violet-200">async</span>
                <code className="font-mono text-[13px] text-white/75">passway.load(options?)</code>
              </div>
              <p suppressHydrationWarning className="mt-4 text-[12px] leading-6 text-white/35">
                Authenticates with <code className="text-white/60">PASSWAY_KEY</code>, resolves the permitted environment, and returns a read-only object containing your secret values.
              </p>
            </div>

            <div id="configuration" className="mt-9 scroll-mt-24">
              <h3 className="text-lg font-semibold tracking-[-0.025em]">Configuration</h3>
              <div className="mt-4 overflow-x-auto rounded-xl border border-white/[0.07]">
                <table className="w-full min-w-[560px] text-left text-[11px]">
                  <thead className="border-b border-white/[0.06] bg-white/[0.02] text-white/28">
                    <tr><th className="px-4 py-3 font-medium">Option</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Description</th></tr>
                  </thead>
                  <tbody className="text-white/42">
                    <tr className="border-b border-white/[0.05]"><td className="px-4 py-3 font-mono text-[#b9f55d]/75">key</td><td className="px-4 py-3 font-mono text-violet-200/65">string</td><td className="px-4 py-3">Overrides PASSWAY_KEY.</td></tr>
                    <tr><td className="px-4 py-3 font-mono text-[#b9f55d]/75">timeout</td><td className="px-4 py-3 font-mono text-violet-200/65">number</td><td className="px-4 py-3">Request timeout in milliseconds.</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div id="errors" className="mt-9 scroll-mt-24">
              <h3 className="text-lg font-semibold tracking-[-0.025em]">Error handling</h3>
              <p suppressHydrationWarning className="mt-3 text-[12px] leading-6 text-white/35">
                Initialization fails closed. If authentication or resolution fails, the SDK throws a typed error instead of returning partial or stale values.
              </p>
            </div>
          </section>

          <div className="mt-16 grid gap-3 border-t border-white/[0.065] pt-8 sm:grid-cols-2">
            <a href="/" className="group rounded-xl border border-white/[0.07] p-4 transition hover:border-white/[0.12]">
              <p suppressHydrationWarning className="text-[9px] uppercase tracking-wider text-white/22">Back</p>
              <p suppressHydrationWarning className="mt-2 flex items-center gap-2 text-[12px] text-white/55"><ArrowLeft size={13} /> Passway overview</p>
            </a>
            <a href="https://app.passway.co.in" className="group rounded-xl border border-[#b9f55d]/12 bg-[#b9f55d]/[0.025] p-4 text-right transition hover:bg-[#b9f55d]/[0.045]">
              <p suppressHydrationWarning className="text-[9px] uppercase tracking-wider text-[#b9f55d]/45">Next</p>
              <p suppressHydrationWarning className="mt-2 flex items-center justify-end gap-2 text-[12px] text-[#cdf98a]/70">Create your first key <ArrowRight size={13} /></p>
            </a>
          </div>
        </div>
      </main>

      <aside className="fixed bottom-0 right-0 top-16 hidden w-[220px] border-l border-white/[0.045] px-6 py-10 xl:block">
        <p suppressHydrationWarning className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/22">On this page</p>
        <div className="mt-4 space-y-3 text-[10px] text-white/28">
          <a href="#introduction" className="block text-[#b9f55d]/65">Introduction</a>
          <a href="#installation" className="block transition hover:text-white/55">Installation</a>
          <a href="#quick-start" className="block transition hover:text-white/55">Quick start</a>
          <a href="#environments" className="block transition hover:text-white/55">Core concepts</a>
          <a href="#load" className="block transition hover:text-white/55">SDK reference</a>
        </div>
        <div className="mt-8 border-t border-white/[0.06] pt-6">
          <a href="https://github.com" className="flex items-center gap-2 text-[10px] text-white/28 transition hover:text-white/55">
            Edit this page <ExternalLink size={10} />
          </a>
        </div>
      </aside>
    </div>
  );
}
