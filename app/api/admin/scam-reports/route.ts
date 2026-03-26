export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { getAllScamReports } from "@/lib/scam-reports";
import type { ScamReportStatus } from "@/lib/scam-reports";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession(req);
    const status = req.nextUrl.searchParams.get("status") as ScamReportStatus | null;
    const reports = await getAllScamReports(status ?? undefined);
    return NextResponse.json({ reports });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN")
      return NextResponse.json({ error: msg }, { status: msg === "FORBIDDEN" ? 403 : 401 });
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
