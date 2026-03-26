export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { findUser, createUser, hashPassword, createSession, COOKIE_NAME, DISPLAY_COOKIE, SESSION_DAYS } from "@/lib/auth";

// ── Rate limiter: 10 registrations / hour per IP ──────────────────────────────
const registerRl = new Map<string, { count: number; resetAt: number }>();
function checkRegisterRateLimit(ip: string): boolean {
  const now = Date.now();
  const WINDOW = 60 * 60 * 1000; // 1 hour
  const MAX    = 10;
  const entry  = registerRl.get(ip);
  if (!entry || now > entry.resetAt) { registerRl.set(ip, { count: 1, resetAt: now + WINDOW }); return true; }
  if (entry.count >= MAX) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRegisterRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { email, name, password } = await req.json() as { email?: string; name?: string; password?: string };

    if (!email || !name || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const nameTrimmed  = name.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    if (nameTrimmed.length < 2) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }

    if (await findUser(emailTrimmed)) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser(emailTrimmed, nameTrimmed, passwordHash);

    const token = await createSession({ sub: user.id, email: user.email, name: user.name });
    const maxAge = SESSION_DAYS * 24 * 60 * 60;
    const isProduction = process.env.NODE_ENV === "production";

    const res = NextResponse.json({ success: true, name: user.name });
    res.cookies.set(COOKIE_NAME, token, { httpOnly: true, secure: isProduction, sameSite: "strict", maxAge, path: "/" });
    res.cookies.set(DISPLAY_COOKIE, JSON.stringify({ email: user.email, name: user.name }), { httpOnly: false, secure: isProduction, sameSite: "strict", maxAge, path: "/" });
    return res;
  } catch {
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
