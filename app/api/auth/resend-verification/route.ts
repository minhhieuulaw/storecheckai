export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { verifySession, findUserById, generateEmailVerifyToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

// Rate limit: 1 resend per 2 minutes per user
const resendRl = new Map<string, number>();

export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get("session")?.value;
  if (!sessionToken) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const session = await verifySession(sessionToken);
  if (!session?.sub) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

  const now = Date.now();
  const lastSent = resendRl.get(session.sub) ?? 0;
  if (now - lastSent < 2 * 60 * 1000) {
    return NextResponse.json({ error: "Please wait 2 minutes before requesting another email." }, { status: 429 });
  }

  const user = await findUserById(session.sub);
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ error: "Email already verified." }, { status: 400 });

  resendRl.set(session.sub, now);

  const token     = await generateEmailVerifyToken(user.id);
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"}/api/auth/verify-email?token=${token}`;
  sendVerificationEmail(user.email, user.name, verifyUrl).catch(() => {});

  return NextResponse.json({ success: true });
}
