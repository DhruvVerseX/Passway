import Link from "next/link";
import { ArrowRight, Ban, FileKey, KeyRound, ListChecks, Network, ShieldCheck, TerminalSquare } from "lucide-react";
import { CodePreview } from "@/components/code-preview";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const problems = [
  ["Secrets drift", "Values get copied across messages, machines, and stale deployment notes."],
  ["No clean revocation", "A leaked .env file means rotating every credential it contained."],
  ["No access trail", "You cannot answer who fetched production secrets, when, or from where."],
];
const controls = [
  [KeyRound, "Project token", "Scoped, revokable access per environment."],
  [Network, "IP allowlist", "Restrict secret delivery to known networks."],
  [ShieldCheck, "Encryption", "Envelope encryption for stored secret material."],
  [ListChecks, "Audit trail", "Every fetch attempt is recorded with its result."],
];

export default function HomePage() {
  return (
    <><SiteHeader /><main>
      <section className="grid-bg border-b border-[#1D2633] px-5 py-24 text-center sm:py-32">
        <div className="mx-auto max-w-4xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300"><ShieldCheck size={14} /> Runtime secrets delivery, without the sprawl</div>
          <h1 className="text-balance text-5xl font-semibold tracking-[-.045em] sm:text-7xl">Stop sharing <span className="mono text-blue-400">.env</span> files over chat.</h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#8B949E]">Store your secrets once, share one revokable token, and track every access from a clean developer dashboard.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="https://app.passway.co.in/signup" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3B82F6] px-5 py-3 font-semibold text-white">Create your vault <ArrowRight size={17} /></a>
            <a href="https://docs.passway.co.in/quickstart" className="rounded-lg border border-[#1D2633] bg-[#0B0F14] px-5 py-3 font-medium">Read quickstart</a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24">
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-blue-400">The problem</p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Secrets were never meant to live in your team chat.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">{problems.map(([title, body], i) => <article key={title} className="rounded-2xl border border-[#1D2633] bg-[#0B0F14] p-6"><span className="mono text-sm text-[#8B949E]">0{i + 1}</span><h3 className="mt-8 text-lg font-semibold">{title}</h3><p className="mt-2 leading-7 text-[#8B949E]">{body}</p></article>)}</div>
      </section>

      <section className="border-y border-[#1D2633] bg-[#080B10] px-5 py-24">
        <div className="mx-auto max-w-6xl"><div className="text-center"><p className="text-sm font-semibold uppercase tracking-[.2em] text-blue-400">How it works</p><h2 className="mt-4 text-3xl font-semibold sm:text-4xl">From vault to runtime in three steps.</h2></div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">{[[FileKey,"Store","Add environment keys in the encrypted project vault."],[KeyRound,"Issue","Generate a scoped token you can revoke at any time."],[TerminalSquare,"Load","Call the SDK once and use standard process.env values."]].map(([Icon,title,body]) => { const C = Icon as typeof FileKey; return <div key={title as string} className="text-center"><span className="mx-auto grid size-12 place-items-center rounded-xl border border-blue-500/25 bg-blue-500/10 text-blue-400"><C size={21}/></span><h3 className="mt-5 text-lg font-semibold">{title as string}</h3><p className="mt-2 text-sm leading-6 text-[#8B949E]">{body as string}</p></div>; })}</div></div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 lg:grid-cols-2"><div><p className="text-sm font-semibold uppercase tracking-[.2em] text-blue-400">One SDK call</p><h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Your app keeps using <span className="mono">process.env</span>.</h2><p className="mt-5 max-w-xl leading-7 text-[#8B949E]">EnvVault resolves your project token, verifies every access layer, then safely injects the approved secrets at runtime.</p></div><CodePreview /></section>

      <section className="border-y border-[#1D2633] bg-[#080B10] px-5 py-24"><div className="mx-auto max-w-6xl"><div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[.2em] text-blue-400">Defense in depth</p><h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Four layers between the internet and your secrets.</h2></div><div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-[#1D2633] bg-[#1D2633] md:grid-cols-2">{controls.map(([Icon,title,body]) => { const C = Icon as typeof Ban; return <article key={title as string} className="bg-[#0B0F14] p-7"><C className="text-blue-400" size={21}/><h3 className="mt-5 font-semibold">{title as string}</h3><p className="mt-2 text-sm leading-6 text-[#8B949E]">{body as string}</p></article>; })}</div></div></section>

      <section className="px-5 py-24 text-center"><div className="mx-auto max-w-4xl rounded-3xl border border-blue-500/25 bg-blue-500/[.07] px-6 py-16"><h2 className="text-3xl font-semibold sm:text-5xl">Give your secrets a proper exit plan.</h2><p className="mt-5 text-[#8B949E]">Create a project, issue one token, and stop passing credentials around.</p><Link href="https://app.passway.co.in/signup" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#3B82F6] px-5 py-3 font-semibold">Start building <ArrowRight size={17}/></Link></div></section>
    </main><SiteFooter /></>
  );
}
