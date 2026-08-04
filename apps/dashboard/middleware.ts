import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isProtectedPath, protectedCallback } from "@/lib/auth/redirects";

function hasSessionCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get("passway.session_token")?.value ||
      request.cookies.get("__Secure-passway.session_token")?.value ||
      request.cookies.get("passway-session_token")?.value ||
      request.cookies.get("__Secure-passway-session_token")?.value
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isProtectedPath(pathname) && !hasSessionCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = `?callbackURL=${encodeURIComponent(protectedCallback(pathname, search))}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*"],
};
