import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET ?? "fallback-secret-change-me");

// Routes that don't require auth
const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/api/auth",
  "/api/stripe",   // Stripe webhooks & checkout — MUST be public
  "/api/admin",    // Admin helpers — localhost only
  "/api/facebook-check",
  "/checkout",     // success/cancel pages
  "/report",       // shareable public reports
  "/_next",
  "/favicon.ico",
];

// Landing page sections that stay public
const PUBLIC_EXACT = ["/"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (PUBLIC_EXACT.includes(pathname)) return NextResponse.next();
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) return NextResponse.next();

  // Verify session cookie
  const token = req.cookies.get("session")?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      // Old tokens don't have `sub` — force re-login
      if (!payload.sub) throw new Error("legacy token");
      return NextResponse.next();
    } catch {
      // Token invalid/expired/legacy — clear cookies and redirect
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete("session");
      res.cookies.delete("user_display");
      return res;
    }
  }

  // Redirect to login, preserve destination
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
