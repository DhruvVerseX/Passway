"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { resetPasswordSchema } from "@/lib/auth/validation";

type Errors = Record<string, string>;

export function ResetPasswordForm({ token, error }: { token?: string; error?: string }) {
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState(error ? "This reset link is invalid or expired." : "");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError("");
    const parsed = resetPasswordSchema.safeParse({ ...Object.fromEntries(new FormData(event.currentTarget)), token });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }
    setLoading(true);
    try {
      const { error } = await authClient.resetPassword({ token: parsed.data.token, newPassword: parsed.data.password });
      if (error) throw error;
      setDone(true);
    } catch {
      setFormError("This reset link is invalid or expired.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Card className="p-7">
        <h1 className="text-2xl font-semibold">Password updated</h1>
        <p className="mt-3 text-sm leading-6 text-[#8B949E]">You can now sign in with your new password.</p>
        <Link href="/sign-in" className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-3 text-sm font-semibold">
          Sign in <ArrowRight size={16} />
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-7">
      <h1 className="text-2xl font-semibold">Choose a new password</h1>
      <p className="mt-2 text-sm leading-6 text-[#8B949E]">Use a strong password you do not use on another service.</p>
      <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
        <Field name="password" label="New password" type="password" autoComplete="new-password" error={errors.password} disabled={!token || Boolean(error)} />
        <Field name="confirmPassword" label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirmPassword} disabled={!token || Boolean(error)} />
        {(formError || errors.token) && <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">{formError || errors.token}</p>}
        <button disabled={loading || !token || Boolean(error)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-3 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
          {loading && <Loader2 size={16} className="animate-spin" />} Reset password
        </button>
      </form>
      <Link href="/forgot-password" className="mt-6 block text-center text-sm text-blue-400">Request a new link</Link>
    </Card>
  );
}

function Field({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const id = String(props.name);
  return (
    <div>
      <label className="block text-sm font-medium" htmlFor={id}>{label}</label>
      <input id={id} {...props} className="mt-2 w-full rounded-lg border border-[#1D2633] bg-[#05070A] px-3 py-2.5 outline-none focus:border-blue-500 disabled:opacity-60" aria-invalid={Boolean(error)} />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}
