"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { FORGOT_PASSWORD_SUCCESS } from "@/lib/auth/redirects";
import { forgotPasswordSchema } from "@/lib/auth/validation";

export function ForgotPasswordForm() {
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldError("");
    const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Enter a valid email.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await authClient.requestPasswordReset({
        email: parsed.data.email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch {
      setError("We could not send a reset link right now.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Card className="p-7">
        <h1 className="text-2xl font-semibold">Check your inbox</h1>
        <p className="mt-3 text-sm leading-6 text-[#8B949E]">{FORGOT_PASSWORD_SUCCESS}</p>
        <Link href="/sign-in" className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-3 text-sm font-semibold">
          Back to sign in <ArrowRight size={16} />
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-7">
      <h1 className="text-2xl font-semibold">Reset your password</h1>
      <p className="mt-2 text-sm leading-6 text-[#8B949E]">Enter your email and we will send a secure reset link if an account exists.</p>
      <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">Work email</label>
          <input id="email" name="email" type="email" autoComplete="email" className="mt-2 w-full rounded-lg border border-[#1D2633] bg-[#05070A] px-3 py-2.5 outline-none focus:border-blue-500" aria-invalid={Boolean(fieldError)} />
          {fieldError && <p className="mt-1.5 text-xs text-red-400">{fieldError}</p>}
        </div>
        {error && <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-3 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
          {loading && <Loader2 size={16} className="animate-spin" />} Send reset link
        </button>
      </form>
      <Link href="/sign-in" className="mt-6 block text-center text-sm text-blue-400">Back to sign in</Link>
    </Card>
  );
}
