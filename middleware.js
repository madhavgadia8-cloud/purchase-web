import { NextResponse } from "next/server";

// Protect admin routes. Public: /login, /quote/* (vendor form), Next assets.
export function middleware(req) {
  const { pathname } = req.nextUrl;
  const authed = req.cookies.get("pm_auth")?.value === "ok";
  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/quote") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");
  if (!authed && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
