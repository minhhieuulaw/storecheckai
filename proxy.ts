import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { neon } from "@neondatabase/serverless";

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET ?? "fallback-secret-change-me");

// Routes that don't require auth
const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
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

// ── Maintenance mode cache ────────────────────────────────────────────────────
let maintenanceCache: { enabled: boolean; endsAt: string | null } | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 30_000;

async function isMaintenanceActive(dbUrl: string): Promise<boolean> {
  const now = Date.now();
  if (!maintenanceCache || now - cacheTime >= CACHE_TTL_MS) {
    try {
      const sql  = neon(dbUrl);
      const rows = await sql`SELECT value FROM settings WHERE key = 'maintenance' LIMIT 1`;
      if (rows.length > 0) {
        const parsed = JSON.parse(rows[0].value as string) as { enabled: boolean; endsAt: string | null };
        maintenanceCache = { enabled: parsed.enabled, endsAt: parsed.endsAt ?? null };
      } else {
        maintenanceCache = { enabled: false, endsAt: null };
      }
      cacheTime = now;
    } catch {
      return false; // fail open
    }
  }

  if (!maintenanceCache?.enabled) return false;
  if (maintenanceCache.endsAt && new Date(maintenanceCache.endsAt) <= new Date(now)) {
    maintenanceCache = { enabled: false, endsAt: null };
    return false;
  }
  return true;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Maintenance mode (skip for admin + api + maintenance page itself) ────────
  const skipMaintenance =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  if (!skipMaintenance) {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      const inMaintenance = await isMaintenanceActive(dbUrl);
      if (inMaintenance) {
        // Admin email bypasses maintenance
        const token = req.cookies.get("session")?.value;
        let isAdmin = false;
        if (token) {
          try {
            const { payload } = await jwtVerify(token, SECRET);
            const adminEmail = process.env.ADMIN_EMAIL ?? "";
            if (adminEmail && (payload as { email?: string }).email?.toLowerCase() === adminEmail.toLowerCase()) {
              isAdmin = true;
            }
          } catch { /* ignore */ }
        }
        if (!isAdmin) {
          const url = req.nextUrl.clone();
          url.pathname = "/maintenance";
          return NextResponse.rewrite(url);
        }
      }
    }
  }

  // ── Auth guard ────────────────────────────────────────────────────────────────
  if (PUBLIC_EXACT.includes(pathname)) return NextResponse.next();
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get("session")?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      if (!payload.sub) throw new Error("legacy token");
      return NextResponse.next();
    } catch {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete("session");
      res.cookies.delete("user_display");
      return res;
    }
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
