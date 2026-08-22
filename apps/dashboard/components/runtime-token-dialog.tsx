"use client";

import { Check, CheckCircle2, Clipboard, LockKeyhole, X } from "lucide-react";
import { useState } from "react";

export function RuntimeTokenDialog({
  token,
  environmentName,
  onClose,
}: {
  token: string | null;
  environmentName: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  if (!token) return null;

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
    } catch {
      // Clipboard access can be unavailable in embedded previews.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2_200);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md sm:p-6"
      role="presentation"
      onMouseDown={(event) => event.currentTarget === event.target && onClose()}
    >
      <section
        className="w-full max-w-[620px] overflow-hidden rounded-2xl border border-[#b9f55d]/25 bg-[#0f120f] shadow-[0_24px_90px_rgba(0,0,0,.7)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="runtime-token-title"
      >
        <header className="flex items-start justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#b9f55d]/75">
              <span className="h-1.5 w-1.5 rounded-full bg-[#b9f55d]" />
              Runtime access ready
            </div>
            <h2 id="runtime-token-title" className="mt-2 text-lg font-semibold tracking-[-0.025em] text-white">
              Your Passway token
            </h2>
            <p className="mt-1 text-xs text-white/35">
              {environmentName} is hosted and ready to connect.
            </p>
          </div>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-white/35 transition hover:bg-white/[0.06] hover:text-white" aria-label="Close token dialog">
            <X size={17} />
          </button>
        </header>

        <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
          <div className="rounded-xl border border-[#b9f55d]/25 bg-[#b9f55d]/[0.06] p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-9 place-items-center rounded-xl border border-[#b9f55d]/25 bg-[#b9f55d]/10 text-[#b9f55d]">
                <CheckCircle2 size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-white/90">Save this token now</p>
                <p className="mt-1 text-xs leading-5 text-white/45">This is the only time Passway will return the plaintext runtime token. Store it in your deployment secret manager.</p>
              </div>
            </div>
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-white/[0.1] bg-black/30 p-2">
              <code className="min-w-0 flex-1 break-all px-2 py-1 font-mono text-[11px] leading-5 text-[#d9ffa0]">{token}</code>
              <button onClick={copyToken} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-[#b9f55d] px-2.5 text-[10px] font-semibold text-[#10130d] transition hover:bg-[#c8ff72]">
                {copied ? <Check size={12} /> : <Clipboard size={12} />}
                {copied ? "Copied" : "Copy token"}
              </button>
            </div>
          </div>

          <div className="flex gap-2 rounded-lg border border-amber-300/15 bg-amber-300/[0.04] px-3 py-2.5 text-[10px] leading-4 text-amber-100/60">
            <LockKeyhole size={13} className="mt-0.5 shrink-0 text-amber-200/70" />
            <span><b className="font-medium text-amber-100/85">Treat this like a password.</b> Never commit it to source control or paste it into a ticket.</span>
          </div>
        </div>

        <footer className="flex justify-end border-t border-white/[0.07] px-5 py-3.5 sm:px-6">
          <button onClick={onClose} className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.09] px-3 text-[11px] font-medium text-white/60 transition hover:bg-white/[0.05] hover:text-white">
            I’ve saved it
            <Check size={13} />
          </button>
        </footer>
      </section>
    </div>
  );
}
