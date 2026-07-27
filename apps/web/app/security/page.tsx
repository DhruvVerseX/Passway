import { Fingerprint, KeyRound, LockKeyhole, Network, ScrollText, ShieldCheck } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const items = [[LockKeyhole,"Encrypted at rest","Secrets are designed for envelope encryption before storage."],[KeyRound,"Scoped tokens","Tokens belong to a project and environment, with immediate revocation."],[Network,"IP restrictions","Allow known networks and reject untrusted request origins."],[ScrollText,"Complete audit history","Track successful fetches and rejected access attempts."],[Fingerprint,"Least privilege","Separate dashboard access from runtime secret delivery."],[ShieldCheck,"No secret exposure","The dashboard never renders a stored secret value after creation."]];

export default function SecurityPage() {
  return <><SiteHeader/><main className="mx-auto max-w-6xl px-5 py-24"><p className="text-sm font-semibold uppercase tracking-[.2em] text-blue-400">Security</p><h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight">Built around the assumption that credentials will be targeted.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-[#8B949E]">EnvVault combines scoped access, network policy, encryption, and traceable events into one delivery path.</p><div className="mt-14 grid gap-4 md:grid-cols-2">{items.map(([Icon,title,body]) => { const C=Icon as typeof ShieldCheck; return <article key={title as string} className="rounded-2xl border border-[#1D2633] bg-[#0B0F14] p-7"><C className="text-blue-400"/><h2 className="mt-6 text-lg font-semibold">{title as string}</h2><p className="mt-2 leading-7 text-[#8B949E]">{body as string}</p></article>; })}</div></main><SiteFooter/></>;
}
