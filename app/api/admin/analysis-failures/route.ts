export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { getAnalysisFailures } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession(req);
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const { rows, total } = await getAnalysisFailures(limit, offset);
    return NextResponse.json({ rows, total });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
