export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { tickets } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminSession();

    const body = await req.json().catch(() => null);
    const action     = body?.action as string | undefined; // "reply" | "close" | "reopen"
    const adminReply = (body?.reply ?? "").trim().slice(0, 5000);

    const now = new Date().toISOString();

    if (action === "reply") {
      if (!adminReply) return NextResponse.json({ error: "Reply text required." }, { status: 400 });
      await db.update(tickets).set({
        adminReply,
        adminRepliedAt: now,
        status:         "replied",
        updatedAt:      now,
      }).where(eq(tickets.id, params.id));
    } else if (action === "close") {
      await db.update(tickets).set({
        status:    "closed",
        updatedAt: now,
      }).where(eq(tickets.id, params.id));
    } else if (action === "reopen") {
      await db.update(tickets).set({
        status:    "open",
        updatedAt: now,
      }).where(eq(tickets.id, params.id));
    } else {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN")
      return NextResponse.json({ success: false, error: msg }, { status: msg === "FORBIDDEN" ? 403 : 401 });
    console.error("Admin ticket patch error:", err);
    return NextResponse.json({ success: false, error: "Failed to update ticket." }, { status: 500 });
  }
}
