import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { dashboardBaseURL, isProtectedPath, signInURL } from "@/lib/auth-ui";

function hasSessionCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get("passway.session_token")?.value ||
    request.cookies.get("__Secure-passway.session_token")?.value ||
    request.cookies.get("passway-session_token")?.value ||
    request.cookies.get("__Secure-passway-session_token")?.value,
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isProtectedPath(pathname) && !hasSessionCookie(request)) {
    const callbackURL = new URL(
      `${pathname}${search}`,
      dashboardBaseURL(),
    ).toString();
    return NextResponse.redirect(signInURL(callbackURL));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*"],
};
