"use client";

import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Github, LockKeyhole, Mail, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

const dashboardBase = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";
const dashboardHome = `${dashboardBase}/dashboard`;

function callbackURL() {
  const fallback = dashboardHome;
  const value = new URLSearchParams(window.location.search).get("callbackURL");
  if (!value) return fallback;
  try {
    const url = new URL(value);
    return url.origin === new URL(dashboardBase).origin ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

export default function SignupPage() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState<"email" | "google" | "github" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const continueWith = async (provider: "google" | "github") => {
    setLoading(provider);
    setErrorMessage(null);
    const { error } = await authClient.signIn.social({ provider, callbackURL: callbackURL() });
    if (error) {
      setErrorMessage(error.message ?? "Unable to continue with this provider.");
      setLoading(null);
    }
  };
  const signUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading("email");
    setErrorMessage(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const { error } = await authClient.signUp.email({
      name: String(form.get("name")),
      email,
      password: String(form.get("password")),
      callbackURL: callbackURL(),
    });

    if (error) {
      setErrorMessage(error.message ?? "Unable to create your account.");
      setLoading(null);
      return;
    }

    window.location.assign(`/auth/verify-email?email=${encodeURIComponent(email)}&callbackURL=${encodeURIComponent(callbackURL())}`);
  };
  return (
    <main className="auth-page min-h-screen bg-[#0b0d0b] text-white selection:bg-[#b9f55d]/25">
      <div className="auth-grid pointer-events-none fixed inset-0 opacity-45" />
      <header className="relative z-10 mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
        <a href="/" className="inline-flex items-center gap-2.5" aria-label="Passway home">
          <img src="/assets/logo/passway-mark-dark.svg" alt="" className="h-9 w-9 shrink-0" aria-hidden="true" />
          <span className="text-[15px] font-semibold">passway</span>
        </a>
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
            <p className="text-[10px] font-semibold uppercase text-[#b9f55d]/70">Create your account</p>
            <h1 className="mt-3 text-[28px] font-semibold text-[#f6f7f4] sm:text-[32px]">Start building securely</h1>
            <p className="mt-2 text-[13px] leading-6 text-white/40">Protect your first application in less than two minutes.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => continueWith("google")} className="auth-social">
              {loading === "google" ? <RefreshCw size={15} className="animate-spin" /> : <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4"><path fill="#EA4335" d="M12 10.2v4.1h5.7c-.25 1.32-1.5 3.87-5.7 3.87A6.18 6.18 0 0 1 12 5.8c2.39 0 3.99 1.02 4.91 1.9l3.35-3.23A11.13 11.13 0 0 0 12 1.25a10.75 10.75 0 1 0 0 21.5c6.2 0 10.3-4.36 10.3-10.5 0-.7-.08-1.25-.17-1.78H12Z" /><path fill="#4285F4" d="M22.3 12.25c0-.7-.07-1.25-.17-1.78H12v4.05h5.7c-.28 1.4-1.35 2.67-2.9 3.46l3.3 2.56c2.67-2.45 4.2-6.07 4.2-8.29Z" /><path fill="#FBBC05" d="M5.83 14.34A6.42 6.42 0 0 1 5.5 12c0-.81.14-1.6.4-2.33L2.51 7.05A10.74 10.74 0 0 0 1.25 12c0 1.76.42 3.43 1.17 4.9l3.41-2.56Z" /><path fill="#34A853" d="M12 22.75c2.9 0 5.34-.95 7.12-2.6l-3.3-2.56c-.9.6-2.08 1.03-3.82 1.03a6.13 6.13 0 0 1-5.75-4.15L2.87 17.1A10.75 10.75 0 0 0 12 22.75Z" /></svg>}
              Google
            </button>
            <button type="button" onClick={() => continueWith("github")} className="auth-social">{loading === "github" ? <RefreshCw size={15} className="animate-spin" /> : <Github size={16} />}GitHub</button>
          </div>

          <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-white/[0.065]" /><span className="text-[9px] uppercase text-white/25">or continue with email</span><span className="h-px flex-1 bg-white/[0.065]" /></div>

          <form onSubmit={signUp} className="space-y-4">
            <label className="block"><span className="mb-2 block text-[12px] font-medium text-white/65">Full name</span><span className="group relative block"><span className="pointer-events-none absolute inset-y-0 left-3.5 grid place-items-center text-white/25 transition group-focus-within:text-[#b9f55d]/70"><ShieldCheck size={15} /></span><input required name="name" placeholder="Your name" autoComplete="name" className="auth-input" /></span></label>
            <label className="block"><span className="mb-2 block text-[12px] font-medium text-white/65">Work email</span><span className="group relative block"><span className="pointer-events-none absolute inset-y-0 left-3.5 grid place-items-center text-white/25 transition group-focus-within:text-[#b9f55d]/70"><Mail size={15} /></span><input required name="email" type="email" placeholder="you@company.com" autoComplete="email" className="auth-input" /></span></label>
            <label className="block"><span className="mb-2 block text-[12px] font-medium text-white/65">Password</span><span className="group relative block"><span className="pointer-events-none absolute inset-y-0 left-3.5 grid place-items-center text-white/25 transition group-focus-within:text-[#b9f55d]/70"><LockKeyhole size={15} /></span><input required name="password" type={passwordVisible ? "text" : "password"} placeholder="At least 12 characters" autoComplete="new-password" className="auth-input" /><button type="button" onClick={() => setPasswordVisible((value) => !value)} className="absolute inset-y-0 right-3 grid place-items-center px-1 text-white/30 transition hover:text-white/70" aria-label={passwordVisible ? "Hide password" : "Show password"}>{passwordVisible ? <EyeOff size={15} /> : <Eye size={15} />}</button></span></label>
            <p className="text-[10px] leading-5 text-white/30">By continuing, you agree to Passway's <a className="text-white/50 hover:text-white" href="#">Terms</a> and <a className="text-white/50 hover:text-white" href="#">Privacy Policy</a>.</p>
            {errorMessage && <p role="alert" className="text-xs text-red-300">{errorMessage}</p>}
            <button type="submit" disabled={loading !== null} className="auth-submit">{loading === "email" ? <RefreshCw size={15} className="animate-spin" /> : <>Create secure workspace<ArrowRight size={15} strokeWidth={2.5} /></>}</button>
          </form>
          <p className="mt-7 text-center text-[11px] text-white/35">Already have an account?<a href="/auth/login" className="ml-1 font-medium text-[#b9f55d]/75 transition hover:text-[#b9f55d]">Sign in</a></p>
        </div>
      </section>
    </main>
  );
}

