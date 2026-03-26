export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { tickets, users } from "@/lib/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession(req);

    const { searchParams } = req.nextUrl;
    const status   = searchParams.get("status") || undefined; // open | replied | closed
    const page     = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "25", 10)));
    const offset   = (page - 1) * pageSize;

    const rows = await db.execute(sql`
      SELECT t.id, t.user_id, t.subject, t.message, t.status,
             t.admin_reply, t.admin_replied_at, t.created_at, t.updated_at,
             u.email AS user_email, u.name AS user_name
      FROM tickets t
      JOIN users u ON u.id = t.user_id
      ${status ? sql`WHERE t.status = ${status}` : sql``}
      ORDER BY
        CASE t.status WHEN 'open' THEN 0 WHEN 'replied' THEN 1 ELSE 2 END,
        t.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `);

    const countRows = await db.execute(sql`
      SELECT COUNT(*) AS cnt FROM tickets
      ${status ? sql`WHERE status = ${status}` : sql``}
    `);

    const total = Number((countRows.rows[0] as { cnt: string })?.cnt ?? 0);

    return NextResponse.json({ success: true, tickets: rows.rows, total, page, pageSize });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN")
      return NextResponse.json({ success: false, error: msg }, { status: msg === "FORBIDDEN" ? 403 : 401 });
    console.error("Admin tickets error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch tickets." }, { status: 500 });
  }
}
