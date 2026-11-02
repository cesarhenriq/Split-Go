import { protectedRoutes } from "@/config/routes";

export function isProtectedPath(pathname: string): boolean {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function shouldRedirectToLogin(
  pathname: string,
  hasSessionCookie: boolean,
): boolean {
  return isProtectedPath(pathname) && !hasSessionCookie;
}
