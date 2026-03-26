export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { reviewScamReport } from "@/lib/scam-reports";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession(req);
    const { id } = await params;
    const body = await req.json() as { status?: "approved" | "rejected"; adminNote?: string };
    if (body.status !== "approved" && body.status !== "rejected") {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    await reviewScamReport(id, body.status, body.adminNote);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN")
      return NextResponse.json({ error: msg }, { status: msg === "FORBIDDEN" ? 403 : 401 });
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
