"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

const snippet = `import { loadEnv } from "@passway/envvault";

await loadEnv();

console.log(process.env.DATABASE_URL);`;

export function CodePreview() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-[#1D2633] bg-[#0B0F14] text-left shadow-2xl shadow-blue-950/20">
      <div className="flex items-center justify-between border-b border-[#1D2633] px-4 py-3">
        <div className="flex gap-1.5"><i className="size-2.5 rounded-full bg-[#EF4444]" /><i className="size-2.5 rounded-full bg-[#F59E0B]" /><i className="size-2.5 rounded-full bg-[#22C55E]" /></div>
        <button onClick={copy} className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-[#8B949E] hover:bg-white/5 hover:text-white">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button>
      </div>
      <pre className="mono overflow-x-auto p-6 text-sm leading-7 text-[#E6EDF3]"><code>{snippet}</code></pre>
    </div>
  );
}
