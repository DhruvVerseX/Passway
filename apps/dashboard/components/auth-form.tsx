"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Github, Loader2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Card } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { DEFAULT_AUTH_REDIRECT, safeCallbackURL } from "@/lib/auth/redirects";
import { signInSchema, signUpSchema } from "@/lib/auth/validation";

type Mode = "sign-in" | "sign-up";
type Errors = Record<string, string>;

function errorText(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}

function callbackOrigin() {
  return typeof window === "undefined" ? "" : window.location.origin;
}

export function AuthForm({ mode, callbackURL = DEFAULT_AUTH_REDIRECT }: { mode: Mode; callbackURL?: string }) {
  const router = useRouter();
  const signup = mode === "sign-up";
  const safeCallback = useMemo(() => safeCallbackURL(callbackURL), [callbackURL]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [successEmail, setSuccessEmail] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError("");
    setSuccessEmail("");

    const data = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = signup ? signUpSchema.safeParse(data) : signInSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }

    setLoading(true);
    try {
      if (signup) {
        const value = parsed.data as { name: string; email: string; password: string };
        const { error } = await authClient.signUp.email({
          name: value.name,
          email: value.email,
          password: value.password,
          callbackURL: `${callbackOrigin()}/verify-email?verified=1`,
        });
        if (error) throw error;
        setSuccessEmail(value.email);
        return;
      }

      const value = parsed.data as { email: string; password: string };
      const { error } = await authClient.signIn.email({
        email: value.email,
        password: value.password,
        callbackURL: safeCallback,
      });
      if (error) throw error;
      router.push(safeCallback);
      router.refresh();
    } catch (error) {
      setFormError(signup ? errorText(error, "We could not create that account.") : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  async function social(provider: "google" | "github") {
    setFormError("");
    setOauthLoading(provider);
    try {
      await authClient.signIn.social({ provider, callbackURL: safeCallback });
    } catch (error) {
      setFormError(errorText(error, `Could not start ${provider} sign-in.`));
      setOauthLoading(null);
    }
  }

  if (successEmail) {
    return (
      <Card className="p-7">
        <h1 className="text-2xl font-semibold">Check your inbox</h1>
        <p className="mt-3 text-sm leading-6 text-[#8B949E]">
          We sent a verification link to <span className="text-[#E6EDF3]">{successEmail}</span>. Verify your email, then sign in.
        </p>
        <Link href="/sign-in" className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-3 text-sm font-semibold">
          Back to sign in <ArrowRight size={16} />
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-7">
      <h1 className="text-2xl font-semibold">{signup ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-2 text-sm text-[#8B949E]">{signup ? "Start securing your runtime secrets." : "Sign in to manage your vaults."}</p>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => social("google")} disabled={loading || oauthLoading !== null} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1D2633] bg-[#05070A] px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60">
          {oauthLoading === "google" ? <Loader2 size={16} className="animate-spin" /> : <span className="font-bold">G</span>} Google
        </button>
        <button type="button" onClick={() => social("github")} disabled={loading || oauthLoading !== null} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1D2633] bg-[#05070A] px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60">
          {oauthLoading === "github" ? <Loader2 size={16} className="animate-spin" /> : <Github size={16} />} GitHub
        </button>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-[#8B949E]"><span className="h-px flex-1 bg-[#1D2633]" />or<span className="h-px flex-1 bg-[#1D2633]" /></div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        {signup && <Field name="name" label="Full name" autoComplete="name" error={errors.name} />}
        <Field name="email" label="Work email" type="email" autoComplete="email" error={errors.email} />
        <div>
          <label className="block text-sm font-medium" htmlFor="password">Password</label>
          <div className="mt-2 flex rounded-lg border border-[#1D2633] bg-[#05070A] focus-within:border-blue-500">
            <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} className="min-w-0 flex-1 rounded-lg bg-transparent px-3 py-2.5 outline-none placeholder:text-[#4B5563]" aria-invalid={Boolean(errors.password)} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="grid w-11 place-items-center text-[#8B949E]" aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
        </div>
        {signup && <Field name="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" error={errors.confirmPassword} />}
        {formError && <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">{formError}</p>}
        <button disabled={loading || oauthLoading !== null} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-3 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
          {loading && <Loader2 size={16} className="animate-spin" />}{signup ? "Create account" : "Sign in"}<ArrowRight size={16} />
        </button>
      </form>

      {!signup && <Link href="/forgot-password" className="mt-4 block text-center text-sm text-blue-400">Forgot your password?</Link>}
      {signup && <p className="mt-4 text-center text-xs leading-5 text-[#8B949E]">By creating an account, you agree to use Passway securely and keep your credentials private.</p>}
      <p className="mt-6 text-center text-sm text-[#8B949E]">
        {signup ? "Already have an account?" : "New to Passway?"} <Link className="text-blue-400" href={signup ? "/sign-in" : "/sign-up"}>{signup ? "Sign in" : "Create account"}</Link>
      </p>
    </Card>
  );
}

function Field({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const id = String(props.name);
  return (
    <div>
      <label className="block text-sm font-medium" htmlFor={id}>{label}</label>
      <input id={id} {...props} className="mt-2 w-full rounded-lg border border-[#1D2633] bg-[#05070A] px-3 py-2.5 outline-none placeholder:text-[#4B5563] focus:border-blue-500" aria-invalid={Boolean(error)} />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}
