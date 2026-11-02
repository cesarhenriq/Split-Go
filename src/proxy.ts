import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { shouldRedirectToLogin } from "@/lib/auth/redirect";

export function proxy(request: NextRequest) {
  const hasSessionCookie = Boolean(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );

  if (shouldRedirectToLogin(request.nextUrl.pathname, hasSessionCookie)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/groups/:path*",
    "/expenses/:path*",
    "/settlements/:path*",
    "/settings/:path*",
  ],
};
