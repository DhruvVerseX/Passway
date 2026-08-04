"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { verificationEmailSchema } from "@/lib/auth/validation";

export function VerifyEmailPanel({ verified, error }: { verified?: boolean; error?: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [formError, setFormError] = useState(error ? "This verification link is invalid or expired." : "");

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError("");
    setFormError("");
    const parsed = verificationEmailSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Enter a valid email.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await authClient.sendVerificationEmail({
        email: parsed.data.email,
        callbackURL: `${window.location.origin}/verify-email?verified=1`,
      });
      if (error) throw error;
      setSent(true);
    } catch {
      setFormError("We could not send a verification email right now.");
    } finally {
      setLoading(false);
    }
  }

  if (verified) {
    return (
      <Card className="p-7">
        <h1 className="text-2xl font-semibold">Email verified</h1>
        <p className="mt-3 text-sm leading-6 text-[#8B949E]">Your Passway account is ready. You can sign in now.</p>
        <Link href="/sign-in" className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-3 text-sm font-semibold">
          Sign in <ArrowRight size={16} />
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-7">
      <h1 className="text-2xl font-semibold">Verify your email</h1>
      <p className="mt-2 text-sm leading-6 text-[#8B949E]">Open the verification link we sent. You can request another link below.</p>
      <form onSubmit={resend} className="mt-7 space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">Work email</label>
          <input id="email" name="email" type="email" autoComplete="email" className="mt-2 w-full rounded-lg border border-[#1D2633] bg-[#05070A] px-3 py-2.5 outline-none focus:border-blue-500" aria-invalid={Boolean(fieldError)} />
          {fieldError && <p className="mt-1.5 text-xs text-red-400">{fieldError}</p>}
        </div>
        {sent && <p className="rounded-lg border border-green-500/25 bg-green-500/10 px-3 py-2 text-sm text-green-300">If an account exists for this email, we sent a verification link.</p>}
        {formError && <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">{formError}</p>}
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-3 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
          {loading && <Loader2 size={16} className="animate-spin" />} Resend verification email
        </button>
      </form>
      <Link href="/sign-in" className="mt-6 block text-center text-sm text-blue-400">Back to sign in</Link>
    </Card>
  );
}
