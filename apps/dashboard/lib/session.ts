import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DEFAULT_AUTH_REDIRECT, safeCallbackURL, signInURL } from "@/lib/auth/redirects";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession(callbackURL = DEFAULT_AUTH_REDIRECT) {
  const session = await getSession();
  if (!session) redirect(signInURL(callbackURL));
  return session;
}

export async function redirectAuthenticatedUsers() {
  const session = await getSession();
  if (session) redirect(DEFAULT_AUTH_REDIRECT);
}

export function redirectAfterAuth(value: string | null | undefined) {
  redirect(safeCallbackURL(value));
}
