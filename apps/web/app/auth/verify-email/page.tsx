"use client";

import { ArrowLeft, ArrowRight, Check, Mail, Sparkles } from "lucide-react";
import { useState } from "react";

const dashboardHome = `${process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001"}/dashboard`;

export default function VerifyEmailPage() {
  const [sent, setSent] = useState(false);

  return (
    <main className="auth-page min-h-screen bg-[#0b0d0b] text-white selection:bg-[#b9f55d]/25">
      <div className="auth-grid pointer-events-none fixed inset-0 opacity-45" />
      <header className="relative z-10 mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
        <a href="/" className="inline-flex items-center gap-2.5" aria-label="Passway home"><img src="/assets/logo/passway-mark-dark.svg" alt="" className="h-9 w-9 shrink-0" aria-hidden="true" /><span className="text-[15px] font-semibold">passway</span></a>
        <a href="/" className="inline-flex items-center gap-2 text-xs font-medium text-white/40 transition hover:text-white/75"><ArrowLeft size={14} /> Back to home</a>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-76px)] max-w-[1160px] items-center gap-16 px-5 pb-16 pt-6 sm:px-8 lg:grid-cols-[1fr_460px] lg:pb-24">
        <div className="hidden max-w-[500px] lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#b9f55d]/15 bg-[#b9f55d]/[0.05] px-3 py-1.5 text-[10px] font-medium uppercase text-[#cef98b]"><Sparkles size={11} /> Secure by default</div>
          <h2 className="mt-7 text-[52px] font-semibold leading-[1.02] text-[#f6f7f4]">Secrets belong in infrastructure, not source code.</h2>
          <p className="mt-6 max-w-[440px] text-[14px] leading-7 text-white/40">Give every application short-lived, scoped access to the credentials it needs without passing around another .env file.</p>
          <div className="mt-10 space-y-4">
            <div className="flex items-center gap-3 text-[12px] text-white/55"><span className="grid h-5 w-5 place-items-center rounded-full border border-[#b9f55d]/20 bg-[#b9f55d]/[0.06] text-[#b9f55d]"><Check size={11} strokeWidth={3} /></span>End-to-end encrypted secret storage</div>
            <div className="flex items-center gap-3 text-[12px] text-white/55"><span className="grid h-5 w-5 place-items-center rounded-full border border-[#b9f55d]/20 bg-[#b9f55d]/[0.06] text-[#b9f55d]"><Check size={11} strokeWidth={3} /></span>Fine-grained access for every environment</div>
            <div className="flex items-center gap-3 text-[12px] text-white/55"><span className="grid h-5 w-5 place-items-center rounded-full border border-[#b9f55d]/20 bg-[#b9f55d]/[0.06] text-[#b9f55d]"><Check size={11} strokeWidth={3} /></span>Instant revocation and complete audit history</div>
          </div>
        </div>

        <div className="auth-card reveal w-full rounded-[24px] border border-white/[0.075] bg-[#10130f]/90 p-5 shadow-[0_35px_100px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-8">
          <div className="mb-7">
            <p className="text-[10px] font-semibold uppercase text-[#b9f55d]/70">Check your inbox</p>
            <h1 className="mt-3 text-[28px] font-semibold text-[#f6f7f4] sm:text-[32px]">Verify your email</h1>
            <p className="mt-2 text-[13px] leading-6 text-white/40">We sent a verification link to <span className="font-medium text-white/70">you@company.com</span></p>
          </div>
          <div className="mb-7 grid h-14 w-14 place-items-center rounded-2xl border border-[#b9f55d]/16 bg-[#b9f55d]/[0.06] text-[#b9f55d]"><Mail size={24} /></div>
          <a href={dashboardHome} className="auth-submit">Continue to dashboard <ArrowRight size={15} /></a>
          <button type="button" onClick={() => setSent(true)} className="mt-3 h-11 w-full rounded-xl border border-white/[0.075] bg-white/[0.025] text-xs font-medium text-white/55 transition hover:bg-white/[0.05] hover:text-white">{sent ? "Verification email sent" : "Resend verification email"}</button>
          <p className="mt-5 text-center text-[10px] leading-5 text-white/30">Didn't receive it? Check your spam folder or confirm that your email address is correct.</p>
          <p className="mt-7 text-center text-[11px] text-white/35">Wrong email address?<a href="/auth/signup" className="ml-1 font-medium text-[#b9f55d]/75 transition hover:text-[#b9f55d]">Create a new account</a></p>
        </div>
      </section>
    </main>
  );
}