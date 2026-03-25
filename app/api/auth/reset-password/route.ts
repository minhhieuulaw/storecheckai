export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { passwordResetTokens } from "@/lib/schema";
import { findUserById, hashPassword, updateUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body     = await req.json();
    const token    = typeof body?.token    === "string" ? body.token.trim()    : "";
    const password = typeof body?.password === "string" ? body.password        : "";

    if (!token || !password) {
      return NextResponse.json({ success: false, error: "Token and new password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters." }, { status: 400 });
    }

    // Find token
    const rows = await db.select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);

    const record = rows[0];

    if (!record) {
      return NextResponse.json({ success: false, error: "Invalid or expired reset link." }, { status: 400 });
    }
    if (record.usedAt) {
      return NextResponse.json({ success: false, error: "This reset link has already been used." }, { status: 400 });
    }
    if (new Date(record.expiresAt) < new Date()) {
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
      return NextResponse.json({ success: false, error: "This reset link has expired. Please request a new one." }, { status: 400 });
    }

    const user = await findUserById(record.userId);
    if (!user || user.isBanned) {
      return NextResponse.json({ success: false, error: "Account not found." }, { status: 404 });
    }

    // Update password
    const passwordHash = await hashPassword(password);
    await updateUser(user.id, { passwordHash });

    // Mark token as used
    await db.update(passwordResetTokens)
      .set({ usedAt: new Date().toISOString() })
      .where(eq(passwordResetTokens.token, token));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
