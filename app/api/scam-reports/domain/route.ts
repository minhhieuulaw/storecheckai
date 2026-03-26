export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getApprovedReportsForDomain } from "@/lib/scam-reports";

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("d");
  if (!domain) return NextResponse.json({ reports: [] });
  try {
    const reports = await getApprovedReportsForDomain(domain);
    // Strip image data from public response — only return metadata
    const safe = reports.map(r => ({
      id:        r.id,
      shopUrl:   r.shopUrl,
      domain:    r.domain,
      content:   r.content,
      createdAt: r.createdAt,
      imageCount: (r.images as string[]).length,
    }));
    return NextResponse.json({ reports: safe });
  } catch {
    return NextResponse.json({ reports: [] });
  }
}
