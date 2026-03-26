export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { findUser, createUser, hashPassword, createSession, generateEmailVerifyToken, countAccountsByIp, COOKIE_NAME, DISPLAY_COOKIE, SESSION_DAYS } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

// ── Disposable email domains (most common abuse domains) ───────────────────────
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com","guerrillamail.com","guerrillamail.net","guerrillamail.org",
  "guerrillamailblock.com","guerrillamail.biz","guerrillamail.de",
  "tempmail.com","temp-mail.org","temp-mail.io","throwam.com","throwaway.email",
  "sharklasers.com","guerrillamailblock.com","grr.la","guerrillamail.info",
  "spam4.me","yopmail.com","yopmail.fr","yopmail.net","cool.fr.nf",
  "jetable.fr.nf","nospam.ze.tc","nomail.xl.cx","mega.zik.dj","speed.1s.fr",
  "courriel.fr.nf","moncourrier.fr.nf","monemail.fr.nf","monmail.fr.nf",
  "trashmail.com","trashmail.at","trashmail.io","trashmail.me","trashmail.net",
  "trashmail.org","trashmail.xyz","dispostable.com","maildrop.cc","mailnull.com",
  "mailnesia.com","spamgourmet.com","spamgourmet.net","spamgourmet.org",
  "10minutemail.com","10minutemail.net","10minutemail.org","10minutemail.de",
  "10minutemail.co.uk","10minutemail.info","10minutemail.pro","10minutemail.be",
  "10minemail.com","discard.email","fakeinbox.com","filzmail.com","mailexpire.com",
  "mailme.lv","mailmoat.com","mailnew.com","mailnowfree.com","mintemail.com",
  "mt2014.com","mt2015.com","spamfree24.org","spamhole.com","spamify.com",
  "spamthis.co.uk","spamtroll.net","supergreatmail.com","teleworm.us",
  "tempinbox.com","tempr.email","throwam.com","trbvm.com","uggsrock.com",
  "wegwerfmail.de","wegwerfmail.net","wegwerfmail.org","wegwerfadresse.de",
]);

function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}

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
    if (isDisposableEmail(emailTrimmed)) {
      return NextResponse.json({ error: "Disposable email addresses are not allowed. Please use a real email." }, { status: 400 });
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

    // IP abuse check: if this IP already has 3+ accounts, no free check will be credited on verify
    // (We still allow registration but pass a flag in the verify token flow via countAccountsByIp)
    const passwordHash = await hashPassword(password);
    const user = await createUser(emailTrimmed, nameTrimmed, passwordHash, ip);

    // Generate verify token + send verification email (fire-and-forget)
    const token     = await generateEmailVerifyToken(user.id);
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"}/api/auth/verify-email?token=${token}`;
    sendVerificationEmail(user.email, user.name, verifyUrl).catch(() => {});

    // Log user in immediately (they can browse but have 0 checks until verified)
    const sessionToken = await createSession({ sub: user.id, email: user.email, name: user.name });
    const maxAge = SESSION_DAYS * 24 * 60 * 60;
    const isProduction = process.env.NODE_ENV === "production";

    const res = NextResponse.json({ success: true, name: user.name, needsVerification: true });
    res.cookies.set(COOKIE_NAME, sessionToken, { httpOnly: true, secure: isProduction, sameSite: "strict", maxAge, path: "/" });
    res.cookies.set(DISPLAY_COOKIE, JSON.stringify({ email: user.email, name: user.name }), { httpOnly: false, secure: isProduction, sameSite: "strict", maxAge, path: "/" });
    return res;
  } catch {
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
