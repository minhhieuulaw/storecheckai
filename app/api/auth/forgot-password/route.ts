export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { eq, and, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { passwordResetTokens } from "@/lib/schema";
import { findUser } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string): boolean {
  const now   = Date.now();
  const entry = RATE_LIMIT.get(key);
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT.set(key, { count: 1, resetAt: now + 15 * 60_000 }); // 15 min window
    return true;
  }
  if (entry.count >= 3) return false; // max 3 requests per 15 min
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body  = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const locale = typeof body?.locale === "string" ? body.locale : "en";

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required." }, { status: 400 });
    }

    // Rate limit by email
    if (!rateLimit(email)) {
      // Return success anyway to avoid user enumeration
      return NextResponse.json({ success: true });
    }

    const user = await findUser(email);

    // Always return success to avoid revealing whether the email exists
    if (!user || user.isBanned) {
      return NextResponse.json({ success: true });
    }

    // Delete old unused tokens for this user
    await db.delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, user.id));

    // Generate token
    const token     = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60_000).toISOString(); // 1 hour

    await db.insert(passwordResetTokens).values({
      token,
      userId:    user.id,
      expiresAt,
      createdAt: new Date().toISOString(),
    });

    await sendPasswordResetEmail(user.email, user.name, token, locale);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    // Return success to avoid leaking info
    return NextResponse.json({ success: true });
  }
}
