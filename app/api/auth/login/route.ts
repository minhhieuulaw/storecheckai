export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { findUser, verifyPassword, createSession, COOKIE_NAME, DISPLAY_COOKIE, SESSION_DAYS } from "@/lib/auth";

// ── Rate limiter: 5 attempts / 15 minutes per IP ─────────────────────────────
const loginRl = new Map<string, { count: number; resetAt: number }>();
function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const WINDOW = 15 * 60 * 1000; // 15 minutes
  const MAX    = 5;
  const entry  = loginRl.get(ip);
  if (!entry || now > entry.resetAt) { loginRl.set(ip, { count: 1, resetAt: now + WINDOW }); return true; }
  if (entry.count >= MAX) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkLoginRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait 15 minutes and try again." },
      { status: 429 }
    );
  }

  try {
    const { email, password } = await req.json() as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await findUser(email);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    if (user.isBanned) {
      return NextResponse.json({ error: "This account has been suspended. Please contact support." }, { status: 403 });
    }

    const token = await createSession({ sub: user.id, email: user.email, name: user.name });
    const maxAge = SESSION_DAYS * 24 * 60 * 60;
    const isProduction = process.env.NODE_ENV === "production";

    const res = NextResponse.json({ success: true, name: user.name });
    res.cookies.set(COOKIE_NAME, token, { httpOnly: true, secure: isProduction, sameSite: "strict", maxAge, path: "/" });
    res.cookies.set(DISPLAY_COOKIE, JSON.stringify({ email: user.email, name: user.name }), { httpOnly: false, secure: isProduction, sameSite: "strict", maxAge, path: "/" });
    return res;
  } catch {
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
