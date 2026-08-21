"use client";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-2 rounded-md p-2 text-xs text-[#8B949E] hover:bg-white/5 hover:text-white"
      aria-label={`Copy ${label}`}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      <span className="hidden sm:inline">{copied ? "Copied" : label}</span>
    </button>
  );
}
