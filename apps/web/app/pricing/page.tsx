import { Check } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function PricingPage() {
  return <><SiteHeader/><main className="mx-auto max-w-6xl px-5 py-24 text-center"><p className="text-sm font-semibold uppercase tracking-[.2em] text-blue-400">Simple pricing</p><h1 className="mt-5 text-5xl font-semibold tracking-tight">Start free. Scale when your team does.</h1><p className="mx-auto mt-5 max-w-xl text-[#8B949E]">Plans are a frontend preview only. Billing is not connected yet.</p><div className="mx-auto mt-14 grid max-w-4xl gap-5 text-left md:grid-cols-2"><Plan name="Developer" price="$0" features={["3 projects","25 secrets per project","7-day access logs","Community support"]}/><Plan name="Team" price="$29" featured features={["Unlimited projects","Advanced IP rules","90-day access logs","Priority support"]}/></div></main><SiteFooter/></>;
}
function Plan({name,price,features,featured=false}:{name:string;price:string;features:string[];featured?:boolean}) {
  return <article className={`rounded-2xl border bg-[#0B0F14] p-8 ${featured?"border-blue-500/60":"border-[#1D2633]"}`}><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{name}</h2>{featured&&<span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400">Recommended</span>}</div><p className="mt-7 text-4xl font-semibold">{price}<span className="text-sm font-normal text-[#8B949E]"> / month</span></p><ul className="mt-8 space-y-4 text-sm">{features.map(x=><li key={x} className="flex gap-3"><Check size={17} className="text-[#22C55E]"/>{x}</li>)}</ul><a href="https://app.passway.co.in/signup" className={`mt-9 block rounded-lg py-3 text-center font-semibold ${featured?"bg-[#3B82F6]":"border border-[#1D2633]"}`}>Get started</a></article>;
}
