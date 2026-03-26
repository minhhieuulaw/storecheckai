export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, getAdminStats } from "@/lib/admin";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession(req);
    const stats = await getAdminStats();
    return NextResponse.json({ success: true, stats });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN")
      return NextResponse.json({ success: false, error: msg }, { status: msg === "FORBIDDEN" ? 403 : 401 });
    console.error("Admin stats error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch stats." }, { status: 500 });
  }
}
