export const DEFAULT_AUTH_REDIRECT = "/dashboard";
export const FORGOT_PASSWORD_SUCCESS =
  "If an account exists for this email, we have sent a password-reset link.";

export function apiBaseURL() {
  return process.env.NEXT_PUBLIC_PASSWAY_API_URL ?? "http://localhost:4000";
}

export function webBaseURL() {
  return process.env.NEXT_PUBLIC_MARKETING_URL ?? "http://localhost:3000";
}

export function dashboardBaseURL() {
  return process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function safeCallbackURL(value: string | null | undefined) {
  if (!value) return DEFAULT_AUTH_REDIRECT;
  if (value.startsWith("//")) return DEFAULT_AUTH_REDIRECT;
  if (value.startsWith("/")) return value;

  try {
    const url = new URL(value);
    const dashboardOrigin = new URL(dashboardBaseURL()).origin;
    return url.origin === dashboardOrigin ? `${url.pathname}${url.search}${url.hash}` : DEFAULT_AUTH_REDIRECT;
  } catch {
    return DEFAULT_AUTH_REDIRECT;
  }
}

export function signInURL(callbackURL: string) {
  const callback = new URL(safeCallbackURL(callbackURL), dashboardBaseURL()).toString();
  return `${webBaseURL()}/auth/login?callbackURL=${encodeURIComponent(callback)}`;
}

export function protectedCallback(pathname: string, search = "") {
  return safeCallbackURL(`${pathname}${search}`);
}

export function isProtectedPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname === "/projects" || pathname.startsWith("/projects/");
}
