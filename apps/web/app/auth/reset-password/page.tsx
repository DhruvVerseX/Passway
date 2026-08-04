"use client";

import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, KeyRound, LockKeyhole, Mail, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"request" | "reset">("request");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("email");
    if (value) {
      setEmail(value);
      setStep("reset");
    }
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    if (step === "request") {
      const { error } = await authClient.emailOtp.requestPasswordReset({ email });
      if (error) {
        setErrorMessage(error.message ?? "Unable to send a reset code.");
        setLoading(false);
        return;
      }
      window.history.replaceState(null, "", `/auth/reset-password?email=${encodeURIComponent(email)}`);
      setStep("reset");
      setLoading(false);
      return;
    }

    if (code.length !== 6) {
      setErrorMessage("Enter the 6-digit code from your email.");
      setLoading(false);
      return;
    }
    if (password.length < 12) {
      setErrorMessage("Your new password must be at least 12 characters.");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("The passwords do not match.");
      setLoading(false);
      return;
    }

    const { error } = await authClient.emailOtp.resetPassword({ email, otp: code, password });
    if (error) {
      setErrorMessage(error.message ?? "That reset code is invalid or expired.");
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
    window.setTimeout(() => window.location.assign("/auth/login"), 700);
  };

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
        </div>

        <div className="auth-card reveal w-full rounded-[24px] border border-white/[0.075] bg-[#10130f]/90 p-5 shadow-[0_35px_100px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-8">
          <div className="mb-7">
            <p className="text-[10px] font-semibold uppercase text-[#b9f55d]/70">Account recovery</p>
            <h1 className="mt-3 text-[28px] font-semibold text-[#f6f7f4] sm:text-[32px]">{step === "request" ? "Reset your password" : "Choose a new password"}</h1>
            <p className="mt-2 text-[13px] leading-6 text-white/40">{step === "request" ? "Enter your email and we'll send you a secure reset code." : `Enter the 6-digit code sent to ${email}.`}</p>
          </div>
          <div className="mb-6 grid h-12 w-12 place-items-center rounded-xl border border-[#b9f55d]/16 bg-[#b9f55d]/[0.06] text-[#b9f55d]"><KeyRound size={21} /></div>
          <form onSubmit={submit} className="space-y-4">
            {step === "request" ? <label className="block"><span className="mb-2 block text-[12px] font-medium text-white/65">Email address</span><span className="group relative block"><span className="pointer-events-none absolute inset-y-0 left-3.5 grid place-items-center text-white/25"><Mail size={15} /></span><input required value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@company.com" autoComplete="email" className="auth-input" /></span></label> : <>
              <label className="block"><span className="mb-2 block text-[12px] font-medium text-white/65">Reset code</span><input required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="auth-input text-center font-mono tracking-[0.45em]" /></label>
              <label className="block"><span className="mb-2 block text-[12px] font-medium text-white/65">New password</span><span className="group relative block"><span className="pointer-events-none absolute inset-y-0 left-3.5 grid place-items-center text-white/25"><LockKeyhole size={15} /></span><input required value={password} onChange={(event) => setPassword(event.target.value)} type={passwordVisible ? "text" : "password"} autoComplete="new-password" placeholder="At least 12 characters" className="auth-input" /><button type="button" onClick={() => setPasswordVisible((value) => !value)} className="absolute inset-y-0 right-3 grid place-items-center px-1 text-white/30" aria-label={passwordVisible ? "Hide password" : "Show password"}>{passwordVisible ? <EyeOff size={15} /> : <Eye size={15} />}</button></span></label>
              <label className="block"><span className="mb-2 block text-[12px] font-medium text-white/65">Confirm password</span><input required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type={passwordVisible ? "text" : "password"} autoComplete="new-password" placeholder="Repeat your password" className="auth-input" /></label>
            </>}
            {errorMessage && <p role="alert" className="text-xs text-red-300">{errorMessage}</p>}
            <button type="submit" disabled={loading || !email} className="auth-submit">{loading ? <RefreshCw size={15} className="animate-spin" /> : submitted ? <><Check size={15} /> Password updated</> : <>{step === "request" ? "Send reset code" : "Reset password"}<ArrowRight size={15} /></>}</button>
          </form>
          {step === "reset" && <button type="button" onClick={() => setStep("request")} className="mt-3 w-full text-center text-xs text-white/40 hover:text-white/75">Use a different email</button>}
          <p className="mt-7 text-center text-[11px] text-white/35">Remembered your password?<a href="/auth/login" className="ml-1 font-medium text-[#b9f55d]/75 transition hover:text-[#b9f55d]">Back to sign in</a></p>
        </div>
      </section>
    </main>
  );
}