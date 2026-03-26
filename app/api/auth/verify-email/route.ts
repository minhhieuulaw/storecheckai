export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { consumeEmailVerifyToken, countAccountsByIp, createSession, COOKIE_NAME, DISPLAY_COOKIE, SESSION_DAYS } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

// Max accounts per IP that still get a free check (3rd+ account from same IP gets no check)
const FREE_CHECK_IP_LIMIT = 2;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${APP_URL}/dashboard?verify=invalid`);
  }

  // IP of the person clicking the link (from email client — may differ from registration IP)
  // We use the stored registrationIp in the DB for the IP limit check, not the click IP
  // So we need to get the user first, then check their registrationIp

  try {
    // Peek at the user before consuming the token to check IP limit
    const { db } = await import("@/lib/db");
    const { users } = await import("@/lib/schema");
    const { eq } = await import("drizzle-orm");

    const rows = await db.select().from(users).where(eq(users.emailVerifyToken, token)).limit(1);
    if (!rows[0]) {
      return NextResponse.redirect(`${APP_URL}/dashboard?verify=invalid`);
    }

    const registrationIp = rows[0].registrationIp ?? "unknown";
    const ipAccountCount = registrationIp !== "unknown"
      ? await countAccountsByIp(registrationIp)
      : 1;

    // Credit check only if this IP hasn't been abused
    const creditCheck = ipAccountCount <= FREE_CHECK_IP_LIMIT;

    const user = await consumeEmailVerifyToken(token, creditCheck);
    if (!user) {
      return NextResponse.redirect(`${APP_URL}/dashboard?verify=expired`);
    }

    // Send welcome email now that they're verified (fire-and-forget)
    sendWelcomeEmail(user.email, user.name).catch(() => {});

    // Set/refresh session
    const sessionToken = await createSession({ sub: user.id, email: user.email, name: user.name });
    const maxAge = SESSION_DAYS * 24 * 60 * 60;
    const isProduction = process.env.NODE_ENV === "production";

    const res = NextResponse.redirect(`${APP_URL}/dashboard?verify=success`);
    res.cookies.set(COOKIE_NAME, sessionToken, { httpOnly: true, secure: isProduction, sameSite: "strict", maxAge, path: "/" });
    res.cookies.set(DISPLAY_COOKIE, JSON.stringify({ email: user.email, name: user.name }), { httpOnly: false, secure: isProduction, sameSite: "strict", maxAge, path: "/" });
    return res;
  } catch {
    return NextResponse.redirect(`${APP_URL}/dashboard?verify=error`);
  }
}
