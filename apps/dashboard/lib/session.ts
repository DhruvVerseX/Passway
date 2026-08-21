import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  apiBaseURL,
  DEFAULT_AUTH_REDIRECT,
  safeCallbackURL,
  signInURL,
} from "@/lib/auth-ui";

type ApiSession = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  session: unknown;
};

export async function getSession(): Promise<ApiSession | null> {
  const incomingHeaders = await headers();
  const cookie = incomingHeaders.get("cookie");
  if (!cookie) return null;

  try {
    const response = await fetch(`${apiBaseURL()}/api/auth/get-session`, {
      headers: { cookie },
      cache: "no-store",
    });

    if (!response.ok) return null;
    return (await response.json()) as ApiSession | null;
  } catch {
    return null;
  }
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
