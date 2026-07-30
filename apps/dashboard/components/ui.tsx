import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from "react";

export function Card({children,className=""}:PropsWithChildren<{className?:string}>){return <div className={`rounded-xl border border-[#1D2633] bg-[#0B0F14] ${className}`}>{children}</div>;}
export function Button({children,className="",variant="primary",...props}:ButtonHTMLAttributes<HTMLButtonElement>&{variant?:"primary"|"secondary"|"danger"}) {
  const styles={primary:"bg-[#3B82F6] text-white hover:bg-blue-500",secondary:"border border-[#1D2633] bg-[#0B0F14] text-[#E6EDF3] hover:bg-white/5",danger:"border border-red-500/30 bg-red-500/10 text-red-400"};
  return <button className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${styles[variant]} ${className}`} {...props}>{children}</button>;
}
export function Badge({children,tone="neutral"}:{children:ReactNode;tone?:"neutral"|"success"|"danger"|"warning"|"blue"}) {
  const styles={neutral:"border-[#1D2633] text-[#8B949E]",success:"border-green-500/25 bg-green-500/10 text-green-400",danger:"border-red-500/25 bg-red-500/10 text-red-400",warning:"border-amber-500/25 bg-amber-500/10 text-amber-400",blue:"border-blue-500/25 bg-blue-500/10 text-blue-400"};
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles[tone]}`}>{children}</span>;
}
export function EmptyState({icon,title,body}:{icon:ReactNode;title:string;body:string}) {
  return <div className="grid min-h-64 place-items-center p-8 text-center"><div><span className="mx-auto grid size-11 place-items-center rounded-xl border border-[#1D2633] bg-[#05070A] text-[#8B949E]">{icon}</span><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm text-[#8B949E]">{body}</p></div></div>;
}
