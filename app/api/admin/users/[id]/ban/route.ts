export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, isAdminEmail } from "@/lib/admin";
import { findUserById, updateUser } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession();
    const { id } = await params;
    const body = await req.json();
    const banned = Boolean(body?.banned);

    const user = await findUserById(id);
    if (!user) return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });

    // Prevent admin from banning themselves
    if (user.email === session.email) {
      return NextResponse.json({ success: false, error: "Cannot ban yourself." }, { status: 400 });
    }

    // Prevent banning another admin
    if (isAdminEmail(user.email)) {
      return NextResponse.json({ success: false, error: "Cannot ban an admin account." }, { status: 400 });
    }

    await updateUser(id, { isBanned: banned });
    return NextResponse.json({ success: true, isBanned: banned });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN")
      return NextResponse.json({ success: false, error: msg }, { status: msg === "FORBIDDEN" ? 403 : 401 });
    console.error("Admin ban error:", err);
    return NextResponse.json({ success: false, error: "Failed to update ban status." }, { status: 500 });
  }
}
