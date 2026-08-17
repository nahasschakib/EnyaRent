import { NextRequest, NextResponse } from "next/server";


const PROTECTED_PATHS = ["/dashboard", "/mon-espace"];
const SESSION_COOKIE = "better-auth.session_token";

export function proxy(request: NextRequest) {
  console.log("[PROXY] exécuté sur", request.nextUrl.pathname);
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const hasSession =
    !!request.cookies.get(SESSION_COOKIE)?.value ||
    !!request.cookies.get("better-auth.session-token")?.value;

  if (!hasSession) {
    const url = new URL("/auth/sign-in", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
