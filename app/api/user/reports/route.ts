export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getUserReports } from "@/lib/store";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await verifySession(token);
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reports = await getUserReports(session.sub);
  const list = reports.map(r => ({
    id: r.id, url: r.url, domain: r.domain, storeName: r.storeName,
    analyzedAt: r.analyzedAt, trustScore: r.trustScore, verdict: r.verdict,
    returnRisk: r.returnRisk, ogImage: r.ogImage,
  }));
  return NextResponse.json({ reports: list });
}
