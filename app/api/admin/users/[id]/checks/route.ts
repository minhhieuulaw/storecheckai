export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { findUserById } from "@/lib/auth";
import { sql, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const body = await req.json();
    const delta = parseInt(body?.delta, 10);

    if (isNaN(delta) || delta === 0) {
      return NextResponse.json({ success: false, error: "delta must be a non-zero integer." }, { status: 400 });
    }

    const user = await findUserById(id);
    if (!user) return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });

    if (delta > 0) {
      // Add checks
      await db.update(users)
        .set({ checksRemaining: sql`${users.checksRemaining} + ${delta}` })
        .where(eq(users.id, id));
    } else {
      // Subtract — clamp at 0
      await db.execute(sql`
        UPDATE users
        SET checks_remaining = GREATEST(0, checks_remaining + ${delta})
        WHERE id = ${id}
      `);
    }

    const updated = await findUserById(id);
    return NextResponse.json({ success: true, checksRemaining: updated?.checksRemaining ?? 0 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN")
      return NextResponse.json({ success: false, error: msg }, { status: msg === "FORBIDDEN" ? 403 : 401 });
    console.error("Admin checks error:", err);
    return NextResponse.json({ success: false, error: "Failed to update checks." }, { status: 500 });
  }
}
