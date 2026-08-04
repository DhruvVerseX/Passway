export const DEFAULT_AUTH_REDIRECT = "/dashboard";
export const FORGOT_PASSWORD_SUCCESS =
  "If an account exists for this email, we have sent a password-reset link.";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function safeCallbackURL(value: string | null | undefined) {
  if (!value) return DEFAULT_AUTH_REDIRECT;
  if (!value.startsWith("/") || value.startsWith("//")) return DEFAULT_AUTH_REDIRECT;
  if (value.includes("://")) return DEFAULT_AUTH_REDIRECT;
  return value;
}

export function signInURL(callbackURL: string) {
  return `/sign-in?callbackURL=${encodeURIComponent(safeCallbackURL(callbackURL))}`;
}

export function protectedCallback(pathname: string, search = "") {
  return safeCallbackURL(`${pathname}${search}`);
}

export function isProtectedPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname === "/projects" || pathname.startsWith("/projects/");
}
