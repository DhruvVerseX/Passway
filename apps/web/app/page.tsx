"use client";

import {
  ArrowRight,
  Blocks,
  Check,
  ChevronRight,
  CircleCheck,
  CloudCog,
  Code2,
  Copy,
  Database,
  FileKey2,
  Fingerprint,
  GitBranch,
  Github,
  KeyRound,
  LockKeyhole,
  Menu,
  Network,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

const installCommand = "bun add @passway/sdk";
const loginUrl = "/auth/login";
const signupUrl = "/auth/signup";

const problems = [
  {
    icon: GitBranch,
    title: "Secrets scattered everywhere",
    copy: ".env files, CI settings, cloud dashboards, and team chats become an untracked web of sensitive values.",
  },
  {
    icon: Fingerprint,
    title: "No real access boundary",
    copy: "A copied environment file gives every person and every machine the same long-lived access.",
  },
  {
    icon: CloudCog,
    title: "Rotation breaks production",
    copy: "Changing one credential means updating every deployment manually and hoping nothing was missed.",
  },
];

const flow = [
  {
    step: "01",
    icon: LockKeyhole,
    title: "Store once",
    copy: "Add secrets to an encrypted workspace and separate them by environment.",
  },
  {
    step: "02",
    icon: KeyRound,
    title: "Issue scoped access",
    copy: "Create an SDK key with the exact environment and permissions your app needs.",
  },
  {
    step: "03",
    icon: Zap,
    title: "Resolve at runtime",
    copy: "Your app requests secrets when it runs. Values never enter source control.",
  },
];

const features = [
  {
    icon: ShieldCheck,
    title: "Encrypted by design",
    copy: "Secret values are encrypted at rest and delivered only to authenticated runtimes.",
    wide: true,
  },
  {
    icon: Network,
    title: "Environment isolation",
    copy: "Production, preview, and development stay cleanly separated.",
  },
  {
    icon: PackageCheck,
    title: "SDK-first workflow",
    copy: "One tiny package. No sidecars, agents, or infrastructure to maintain.",
  },
  {
    icon: FileKey2,
    title: "Scoped SDK keys",
    copy: "Give each application the minimum access it needs and revoke it instantly.",
  },
  {
    icon: Database,
    title: "Audit every request",
    copy: "Understand which runtime accessed what, where, and when, without logging values.",
    wide: true,
  },
];

function PasswayMark({ compact = false }: { compact?: boolean }) {
  return (
    <img
      src="/assets/logo/passway-mark-dark.svg"
      alt=""
      className={`${compact ? "h-8 w-8" : "h-9 w-9"} shrink-0`}
      aria-hidden="true"
    />
  );
}

function TinyDot({ color = "bg-[#b9f55d]" }: { color?: string }) {
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />;
}

export default function PasswayLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const copyInstall = async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
    } catch {
      // Clipboard access may be unavailable in embedded previews.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#0b0d0b] text-white selection:bg-[#b9f55d]/25">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.065] bg-[#0b0d0b]/78 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center px-5 sm:px-8">
          <a href="#" className="flex items-center gap-2.5" aria-label="Passway home">
            <img src="/assets/logo/passway-logo-dark.svg" alt="Passway" className="h-8 w-auto" />
          </a>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex" aria-label="Primary navigation">
            {[
              ["Product", "#product"],
              ["How it works", "#how-it-works"],
              ["Security", "#security"],
              ["Docs", "https://docs.passway.co.in"],
            ].map(([label, href]) => (
              <a key={label} href={href} className="rounded-lg px-3 py-2 text-xs font-medium text-white/45 transition hover:bg-white/[0.04] hover:text-white/85">
                {label}
              </a>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <a href={loginUrl} className="rounded-lg px-3 py-2 text-xs font-medium text-white/55 transition hover:text-white">
              Sign in
            </a>
            <a href={signupUrl} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#b9f55d] px-3.5 text-xs font-semibold text-[#10130d] transition hover:bg-[#c8ff72]">
              Start building <ArrowRight size={13} strokeWidth={2.5} />
            </a>
          </div>

          <button onClick={() => setMenuOpen(true)} className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] text-white/65 md:hidden" aria-label="Open navigation">
            <Menu size={18} />
          </button>
        </div>
      </header>

      <div className={`fixed inset-0 z-[60] bg-[#0b0d0b] px-5 pt-4 transition duration-300 md:hidden ${menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}>
        <div className="flex h-12 items-center">
          <a href="#" className="flex items-center gap-2.5" onClick={() => setMenuOpen(false)}>
            <img src="/assets/logo/passway-logo-dark.svg" alt="Passway" className="h-8 w-auto" />
          </a>
          <button onClick={() => setMenuOpen(false)} className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] text-white/60" aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>
        <nav className="mt-12 flex flex-col" aria-label="Mobile navigation">
          {[
            ["Product", "#product"],
            ["How it works", "#how-it-works"],
            ["Security", "#security"],
            ["Documentation", "localhost:3000"],
          ].map(([label, href]) => (
            <a key={label} href={href} onClick={() => setMenuOpen(false)} className="flex items-center justify-between border-b border-white/[0.07] py-5 text-lg font-medium text-white/80">
              {label} <ChevronRight size={18} className="text-white/25" />
            </a>
          ))}
        </nav>
        <a href={signupUrl} className="mt-8 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#b9f55d] text-sm font-semibold text-[#10130d]">
          Start building <ArrowRight size={15} />
        </a>
      </div>

      <main>
        <section className="relative px-5 pb-20 pt-36 sm:px-8 sm:pb-28 sm:pt-44">
          <div className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-[920px] -translate-x-1/2 rounded-full bg-[#b9f55d]/[0.045] blur-[120px]" />
          <div className="hero-grid pointer-events-none absolute inset-x-0 top-0 mx-auto h-[690px] max-w-[1200px] opacity-35" />

          <div className="relative mx-auto max-w-[1040px] text-center">
            <div className="reveal reveal-1 inline-flex items-center gap-2 rounded-full border border-[#b9f55d]/15 bg-[#b9f55d]/[0.055] px-3 py-1.5 text-[11px] font-medium text-[#cef98b]">
              <Sparkles size={12} /> Secret infrastructure for modern teams
            </div>
            <h1 className="reveal reveal-2 mx-auto mt-7 max-w-[900px] text-[46px] font-semibold leading-[0.98] tracking-[-0.065em] text-[#f6f7f4] sm:text-[68px] lg:text-[88px]">
              Your secrets should never touch your code.
            </h1>
            <p suppressHydrationWarning className="reveal reveal-3 mx-auto mt-7 max-w-[650px] text-[15px] leading-7 text-white/45 sm:text-[17px]">
              Passway gives every application secure, scoped access to encrypted secrets at runtime without scattered environment files, exposed credentials, or painful rotations.
            </p>

            <div className="reveal reveal-4 mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href={signupUrl} className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#b9f55d] px-5 text-sm font-semibold text-[#10130d] transition hover:bg-[#c8ff72] sm:w-auto">
                Secure your first secret
                <ArrowRight size={15} strokeWidth={2.4} className="transition-transform group-hover:translate-x-0.5" />
              </a>
              <a href="http://localhost:3000/docs" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.025] px-5 text-sm font-medium text-white/70 transition hover:bg-white/[0.05] hover:text-white sm:w-auto">
                <Code2 size={15} /> Read the docs
              </a>
            </div>

            <div className="reveal reveal-5 mx-auto mt-8 flex max-w-max items-center gap-5 text-[11px] text-white/30">
              <span className="flex items-center gap-1.5"><CircleCheck size={13} className="text-[#b9f55d]/70" /> No credit card</span>
              <span className="flex items-center gap-1.5"><CircleCheck size={13} className="text-[#b9f55d]/70" /> Setup in 2 minutes</span>
            </div>
          </div>

          <div className="relative mx-auto mt-16 max-w-360 sm:mt-20">
            <div className="absolute -inset-px rounded-[25px] bg-gradient-to-b from-[#b9f55d]/20 via-white/[0.04] to-transparent" />
            <div className="relative overflow-hidden rounded-3xl border border-black/40 bg-[#10130f] p-2 shadow-[0_45px_120px_rgba(0,0,0,0.55)] sm:p-3">
              <div className="overflow-hidden rounded-[17px] border border-white/[0.07] bg-[#0d0f0c]">
                <img
                  src="/assets/22.png"
                  alt="Passway dashboard showing SDK keys and runtime secret controls"
                  className="block h-auto w-full"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.065] bg-white/[0.012] px-5 py-7 sm:px-8">
          <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-center gap-x-10 gap-y-4 text-[11px] font-medium text-white/27 sm:justify-between">
            <span className="uppercase tracking-[0.18em] text-white/18">Fits your stack</span>
            {["Next.js", "Node.js", "Bun", "Hono", "Vercel", "Railway"].map((name) => <span key={name}>{name}</span>)}
          </div>
        </section>

        <section id="product" className="px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-[1160px]">
            <div className="max-w-2xl">
              <p suppressHydrationWarning className="section-kicker">The problem</p>
              <h2 className="section-title mt-4">Secrets became infrastructure.<br />Managing them didn&apos;t.</h2>
              <p suppressHydrationWarning className="section-copy mt-5">Most teams still move production credentials around like text files. Passway replaces that fragile workflow with one secure control plane.</p>
            </div>
            <div className="mt-12 grid gap-3 lg:grid-cols-3">
              {problems.map((item, index) => (
                <article key={item.title} className="group rounded-2xl border border-white/[0.07] bg-white/[0.018] p-6 transition hover:border-white/[0.12] hover:bg-white/[0.028]">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.075] bg-white/[0.025] text-white/50"><item.icon size={18} /></span>
                    <span className="font-mono text-[10px] text-white/15">0{index + 1}</span>
                  </div>
                  <h3 className="mt-8 text-[17px] font-semibold tracking-[-0.025em]">{item.title}</h3>
                  <p suppressHydrationWarning className="mt-3 text-sm leading-6 text-white/38">{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-white/[0.065] bg-[#0e100e] px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-[1160px]">
            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
              <div>
                <p suppressHydrationWarning className="section-kicker">How it works</p>
                <h2 className="section-title mt-4">From encrypted vault to runtime. Nothing in between.</h2>
              </div>
              <p suppressHydrationWarning className="section-copy lg:justify-self-end">Passway gives your application a secure path to the values it needs while keeping those values out of Git, deployment settings, and developer machines.</p>
            </div>
            <div className="relative mt-16 grid gap-3 lg:grid-cols-3">
              <div className="absolute left-[16%] right-[16%] top-7 hidden h-px bg-gradient-to-r from-transparent via-[#b9f55d]/20 to-transparent lg:block" />
              {flow.map((item) => (
                <article key={item.step} className="relative rounded-2xl border border-white/[0.07] bg-[#0b0d0b] p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl border border-[#b9f55d]/15 bg-[#b9f55d]/[0.055] text-[#b9f55d]"><item.icon size={21} /></span>
                    <span className="font-mono text-[10px] text-white/20">{item.step}</span>
                  </div>
                  <h3 className="mt-8 text-lg font-semibold tracking-[-0.03em]">{item.title}</h3>
                  <p suppressHydrationWarning className="mt-3 text-sm leading-6 text-white/38">{item.copy}</p>
                </article>
              ))}
            </div>

            <div className="mt-12 overflow-hidden rounded-2xl border border-white/[0.07] bg-black/20">
              <div className="flex h-11 items-center border-b border-white/[0.06] px-4">
                <div className="flex items-center gap-2 text-[10px] text-white/30"><TerminalSquare size={13} /> quick-start.ts</div>
                <button onClick={copyInstall} className="ml-auto flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] text-white/30 transition hover:bg-white/[0.04] hover:text-white/70">
                  {copied ? <Check size={12} className="text-[#b9f55d]" /> : <Copy size={11} />} {copied ? "Copied" : "Copy install"}
                </button>
              </div>
              <pre className="overflow-x-auto p-6 font-mono text-[12px] leading-7 sm:p-8 sm:text-[13px]"><code><span className="text-white/25">$</span> <span className="text-[#b9f55d]">bun add</span> <span className="text-white/75">@passway/sdk</span>{"\n\n"}<span className="text-violet-300">import</span> <span className="text-white/70">{"{ passway }"}</span> <span className="text-violet-300">from</span> <span className="text-emerald-200">&quot;@passway/sdk&quot;</span>;{"\n\n"}<span className="text-violet-300">const</span> <span className="text-white/70">env</span> <span className="text-white/30">=</span> <span className="text-violet-300">await</span> <span className="text-white/70">passway.load</span><span className="text-white/30">();</span>{"\n"}<span className="text-white/25">{"// Your secrets arrive securely at runtime."}</span></code></pre>
            </div>
          </div>
        </section>

        <section id="security" className="px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-[1160px]">
            <div className="mx-auto max-w-2xl text-center">
              <p suppressHydrationWarning className="section-kicker justify-center">Built for trust</p>
              <h2 className="section-title mt-4">Security without the ceremony.</h2>
              <p suppressHydrationWarning className="section-copy mx-auto mt-5">A focused security layer that is powerful enough for production and simple enough for every developer.</p>
            </div>
            <div className="mt-14 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {features.map((item) => (
                <article key={item.title} className={`relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.018] p-6 ${item.wide ? "lg:col-span-2" : ""}`}>
                  {item.wide && <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#b9f55d]/[0.05] blur-3xl" />}
                  <span className="relative grid h-10 w-10 place-items-center rounded-xl border border-[#b9f55d]/15 bg-[#b9f55d]/[0.055] text-[#b9f55d]"><item.icon size={18} /></span>
                  <h3 className="relative mt-7 text-[16px] font-semibold tracking-[-0.025em]">{item.title}</h3>
                  <p suppressHydrationWarning className="relative mt-2.5 max-w-lg text-sm leading-6 text-white/38">{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-24 sm:px-8 sm:pb-32">
          <div className="relative mx-auto max-w-[1160px] overflow-hidden rounded-3xl border border-[#b9f55d]/15 bg-[#b9f55d]/[0.045] px-6 py-16 text-center sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#b9f55d]/[0.07] blur-[90px]" />
            <div className="relative">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#b9f55d] text-[#10130d]"><Blocks size={21} /></span>
              <h2 className="mx-auto mt-7 max-w-2xl text-[34px] font-semibold leading-[1.05] tracking-[-0.05em] sm:text-[48px]">Stop shipping secrets with your source code.</h2>
              <p suppressHydrationWarning className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/42 sm:text-base">Create your Passway workspace and secure your first application in minutes.</p>
              <a href={signupUrl} className="group mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-[#b9f55d] px-5 text-sm font-semibold text-[#10130d] transition hover:bg-[#c8ff72]">
                Start building for free <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.065] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-[1160px] flex-col gap-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5"><img src="/assets/logo/passway-logo-dark.svg" alt="Passway" className="h-8 w-auto" /><p suppressHydrationWarning className="text-[10px] text-white/25">Secrets, delivered safely.</p></div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-[11px] text-white/35 sm:ml-auto">
            <a href="https://docs.passway.co.in" className="transition hover:text-white">Documentation</a>
            <a href={loginUrl} className="transition hover:text-white">Dashboard</a>
            <a href="https://api.passway.co.in" className="transition hover:text-white">API status</a>
            <a href="https://github.com" aria-label="Passway on GitHub" className="transition hover:text-white"><Github size={14} /></a>
          </div>
          <p suppressHydrationWarning className="text-[10px] text-white/20">Copyright 2026 Passway</p>
        </div>
      </footer>
    </div>
  );
}
