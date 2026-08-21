"use client";

import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronRight, Copy, Github, Globe2, Info, KeyRound, LockKeyhole, ShieldCheck, Sparkles, Terminal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ControlPlaneShell } from "@/components/control-plane-shell";

const steps = ["Connect project", "Choose environment", "Secure access"];
const environments = [
  { name: "Production", detail: "Live customer traffic", color: "emerald", icon: Globe2 },
  { name: "Preview", detail: "Pull requests & staging", color: "violet", icon: Sparkles },
  { name: "Development", detail: "Local development", color: "sky", icon: Terminal },
] as const;

export default function CreateEnvironmentPage() {
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState("AmiWorthy");
  const [framework, setFramework] = useState("Next.js");
  const [branch, setBranch] = useState("main");
  const [environment, setEnvironment] = useState("Production");
  const [copied, setCopied] = useState(false);
  const [complete, setComplete] = useState(false);

  const copyCommand = async () => {
    try { await navigator.clipboard.writeText("bun add @passway/sdk"); } catch { /* embedded previews can block clipboard */ }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  if (complete) {
    return <ControlPlaneShell active="Environments" title="Environment ready" showCreate={false}>
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs text-white/40 transition hover:text-white"><ArrowLeft size={14} /> Back to overview</Link>
        <section className="mt-8 overflow-hidden rounded-3xl border border-[#b9f55d]/20 bg-[#b9f55d]/[0.045]">
          <div className="border-b border-[#b9f55d]/15 p-7 sm:p-10">
            <span className="grid size-12 place-items-center rounded-2xl border border-[#b9f55d]/25 bg-[#b9f55d]/10 text-[#b9f55d]"><CheckCircle2 size={24} /></span>
            <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b9f55d]/75">Environment created</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">{projectName} is ready for secrets.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">Your {environment.toLowerCase()} environment is isolated and encrypted. Add the first secret or connect your application with the SDK.</p>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
            <Link href="/dashboard/secrets" className="group rounded-2xl border border-white/[0.09] bg-black/20 p-5 transition hover:border-[#b9f55d]/30 hover:bg-black/30">
              <span className="grid size-9 place-items-center rounded-xl border border-[#b9f55d]/20 bg-[#b9f55d]/10 text-[#b9f55d]"><LockKeyhole size={16} /></span>
              <p className="mt-5 text-sm font-semibold text-white/90">Add your first secret</p>
              <p className="mt-1 text-xs leading-5 text-white/35">Store API keys, connection strings, and runtime configuration.</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-[#b9f55d]">Open secrets <ArrowRight size={13} className="transition group-hover:translate-x-0.5" /></span>
            </Link>
            <div className="rounded-2xl border border-white/[0.09] bg-black/20 p-5">
              <span className="grid size-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/50"><Terminal size={16} /></span>
              <p className="mt-5 text-sm font-semibold text-white/90">Connect the SDK</p>
              <p className="mt-1 text-xs leading-5 text-white/35">Use the environment token to fetch secrets at runtime.</p>
              <button onClick={copyCommand} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 font-mono text-[10px] text-white/50 transition hover:border-white/20 hover:text-white/80"><span className="text-[#b9f55d]">$</span> bun add @passway/sdk <Copy size={11} className={copied ? "text-[#b9f55d]" : ""} /></button>
            </div>
          </div>
        </section>
      </div>
    </ControlPlaneShell>;
  }

  return <ControlPlaneShell active="Environments" title="Create environment" showCreate={false}>
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-6 border-b border-white/[0.07] pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href="/dashboard" className="mb-5 inline-flex items-center gap-2 text-xs text-white/35 transition hover:text-white"><ArrowLeft size={14} /> Overview</Link>
          <div className="flex items-center gap-2 text-[11px] font-medium text-[#b9f55d]/80"><span className="h-1.5 w-1.5 rounded-full bg-[#b9f55d]" /> Environment onboarding</div>
          <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.045em] text-white sm:text-[36px]">Bring an environment under control.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">Create an isolated secret space for an application. Values stay encrypted, scoped, and out of your source code.</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/30"><ShieldCheck size={14} className="text-[#b9f55d]" /> Takes about 2 minutes</div>
      </div>

      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_330px]">
        <section>
          <nav aria-label="Onboarding progress" className="mb-7 flex items-center gap-2 overflow-x-auto">
            {steps.map((label, index) => { const number = index + 1; const completeStep = number < step; return <div key={label} className="flex shrink-0 items-center gap-2"><div className={`grid size-7 place-items-center rounded-full border text-[11px] font-semibold ${completeStep ? "border-[#b9f55d]/40 bg-[#b9f55d]/10 text-[#b9f55d]" : number === step ? "border-[#b9f55d] bg-[#b9f55d] text-[#11140c]" : "border-white/[0.12] text-white/30"}`}>{completeStep ? <Check size={13} strokeWidth={2.5} /> : number}</div><span className={`text-xs ${number === step ? "font-medium text-white/80" : "text-white/30"}`}>{label}</span>{number < steps.length && <ChevronRight size={13} className="mx-1 text-white/15" />}</div>; })}
          </nav>

          {step === 1 && <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.075] bg-white/[0.025] p-5 sm:p-6">
              <div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-white/60"><Github size={17} /></span><div><h2 className="text-sm font-semibold text-white/90">Connect your project</h2><p className="mt-1 text-xs leading-5 text-white/35">Tell Passway which application this environment belongs to.</p></div></div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="block sm:col-span-2"><span className="mb-2 block text-xs font-medium text-white/65">Project name</span><input value={projectName} onChange={(event) => setProjectName(event.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#b9f55d]/45 focus:ring-4 focus:ring-[#b9f55d]/[0.06]" placeholder="e.g. Acme API" /></label>
                <label className="block"><span className="mb-2 block text-xs font-medium text-white/65">Framework</span><select value={framework} onChange={(event) => setFramework(event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#111510] px-3.5 text-sm text-white outline-none transition focus:border-[#b9f55d]/45"><option>Next.js</option><option>Node.js</option><option>Python</option><option>Go</option><option>Other</option></select></label>
                <label className="block"><span className="mb-2 block text-xs font-medium text-white/65">Production branch</span><input value={branch} onChange={(event) => setBranch(event.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 font-mono text-sm text-white outline-none transition focus:border-[#b9f55d]/45 focus:ring-4 focus:ring-[#b9f55d]/[0.06]" /></label>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.018] p-4 text-xs leading-5 text-white/40"><Info size={15} className="shrink-0 text-white/35" /> You can add more environments for the same project later without duplicating secrets.</div>
          </div>}

          {step === 2 && <div className="rounded-2xl border border-white/[0.075] bg-white/[0.025] p-5 sm:p-6">
            <div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-xl border border-[#b9f55d]/20 bg-[#b9f55d]/10 text-[#b9f55d]"><Globe2 size={17} /></span><div><h2 className="text-sm font-semibold text-white/90">Choose the runtime environment</h2><p className="mt-1 text-xs leading-5 text-white/35">Environment boundaries keep values and access policies isolated.</p></div></div>
            <div className="mt-6 grid gap-3">
              {environments.map((item) => { const Icon = item.icon; const selected = environment === item.name; const tone = item.color === "emerald" ? "border-emerald-400/40 bg-emerald-400/[0.07] text-emerald-300" : item.color === "violet" ? "border-violet-400/35 bg-violet-400/[0.06] text-violet-300" : "border-sky-400/35 bg-sky-400/[0.06] text-sky-300"; return <button key={item.name} onClick={() => setEnvironment(item.name)} className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${selected ? `${tone} ring-4 ring-white/[0.02]` : "border-white/[0.08] bg-black/15 text-white/50 hover:border-white/20 hover:bg-white/[0.035]"}`}><span className={`grid size-10 place-items-center rounded-xl border ${selected ? "border-current/20 bg-black/15" : "border-white/[0.08] bg-white/[0.025]"}`}><Icon size={17} /></span><span className="min-w-0 flex-1"><span className={`block text-sm font-semibold ${selected ? "text-white" : "text-white/75"}`}>{item.name}</span><span className="mt-1 block text-xs text-white/35">{item.detail}</span></span><span className={`grid size-5 place-items-center rounded-full border ${selected ? "border-[#b9f55d] bg-[#b9f55d] text-[#11140c]" : "border-white/15"}`}>{selected && <Check size={12} strokeWidth={3} />}</span></button>; })}
            </div>
          </div>}

          {step === 3 && <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.075] bg-white/[0.025] p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-xl border border-[#b9f55d]/20 bg-[#b9f55d]/10 text-[#b9f55d]"><LockKeyhole size={17} /></span><div><h2 className="text-sm font-semibold text-white/90">Review secure access</h2><p className="mt-1 text-xs leading-5 text-white/35">Passway generates the access boundary before any secret is added.</p></div></div><div className="mt-6 divide-y divide-white/[0.06] rounded-xl border border-white/[0.075] bg-black/20"><div className="flex items-center justify-between gap-4 p-4"><span className="text-xs text-white/35">Project</span><span className="text-xs font-medium text-white/80">{projectName || "Untitled project"}</span></div><div className="flex items-center justify-between gap-4 p-4"><span className="text-xs text-white/35">Environment</span><span className="rounded-md border border-emerald-400/15 bg-emerald-400/[0.07] px-2 py-1 text-[11px] text-emerald-300">{environment}</span></div><div className="flex items-center justify-between gap-4 p-4"><span className="text-xs text-white/35">Branch</span><span className="font-mono text-xs text-white/65">{branch || "main"}</span></div><div className="flex items-center justify-between gap-4 p-4"><span className="text-xs text-white/35">Default policy</span><span className="inline-flex items-center gap-1.5 text-xs text-[#b9f55d]"><ShieldCheck size={13} /> Least privilege</span></div></div></div>
            <div className="flex gap-3 rounded-xl border border-[#b9f55d]/15 bg-[#b9f55d]/[0.04] p-4"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#b9f55d]" /><p className="text-xs leading-5 text-white/45"><span className="font-medium text-white/75">Your values are never exposed in the browser.</span> Passway encrypts them at rest and only releases scoped values to authenticated runtime sessions.</p></div>
          </div>}

          <div className="mt-7 flex items-center justify-between border-t border-white/[0.07] pt-5"><button onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.09] px-4 text-xs font-medium text-white/55 transition hover:bg-white/[0.04] hover:text-white disabled:pointer-events-none disabled:opacity-0"><ArrowLeft size={14} /> Back</button><button onClick={() => step === 3 ? setComplete(true) : setStep((current) => current + 1)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#b9f55d] px-4 text-xs font-semibold text-[#10130d] transition hover:bg-[#c8ff72] focus:outline-none focus:ring-4 focus:ring-[#b9f55d]/20">{step === 3 ? "Create environment" : "Continue"}<ArrowRight size={14} /></button></div>
        </section>

        <aside className="h-fit space-y-3 xl:sticky xl:top-[92px]">
          <div className="overflow-hidden rounded-2xl border border-white/[0.075] bg-white/[0.025]">
            <div className="border-b border-white/[0.065] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/25">Live preview</p><div className="mt-4 flex items-center gap-3"><img src="/assets/logo/passway-mark-dark.svg" alt="" className="size-9" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-white/85">{projectName || "Your project"}</p><p className="mt-0.5 text-[11px] text-white/35">{environment} environment</p></div><span className="ml-auto h-2 w-2 rounded-full bg-emerald-400" /></div></div>
            <div className="space-y-4 p-5"><div><p className="text-[10px] text-white/30">Runtime access</p><p className="mt-1 font-mono text-xs text-white/65">pw_{environment.toLowerCase().slice(0, 4)}_••••••••</p></div><div><p className="text-[10px] text-white/30">Connected branch</p><p className="mt-1 font-mono text-xs text-white/65">{branch || "main"}</p></div><div className="flex items-center gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.05] p-3 text-[10px] leading-4 text-emerald-200/65"><CheckCircle2 size={13} className="shrink-0 text-emerald-300" /> Encryption and access policy ready</div></div>
          </div>
          <div className="rounded-2xl border border-white/[0.075] bg-white/[0.018] p-5"><div className="flex items-center gap-2"><KeyRound size={14} className="text-[#b9f55d]" /><p className="text-xs font-medium text-white/70">What happens next?</p></div><p className="mt-3 text-xs leading-5 text-white/35">Add secret values, create a scoped runtime token, and install the SDK in your application.</p></div>
        </aside>
      </div>
    </div>
  </ControlPlaneShell>;
}
