export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { createScamReport, getUserScamReports } from "@/lib/scam-reports";

function extractDomain(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url.toLowerCase().replace(/^www\./, "");
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session?.sub) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const reports = await getUserScamReports(session.sub);
  return NextResponse.json({ reports });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session?.sub) return NextResponse.json({ error: "Login required." }, { status: 401 });

  try {
    const body = await req.json() as {
      shopUrl?: string;
      content?: string;
      images?: string[];
    };

    if (!body.shopUrl?.trim()) return NextResponse.json({ error: "Shop URL is required." }, { status: 400 });
    if (!body.content?.trim() || body.content.trim().length < 30) {
      return NextResponse.json({ error: "Description must be at least 30 characters." }, { status: 400 });
    }
    if (!Array.isArray(body.images) || body.images.length === 0) {
      return NextResponse.json({ error: "At least 1 evidence image is required." }, { status: 400 });
    }
    if (body.images.length > 3) {
      return NextResponse.json({ error: "Maximum 3 images allowed." }, { status: 400 });
    }

    const domain = extractDomain(body.shopUrl.trim());
    const report = await createScamReport({
      userId:  session.sub,
      shopUrl: body.shopUrl.trim(),
      domain,
      content: body.content.trim(),
      images:  body.images,
    });

    return NextResponse.json({ success: true, report });
  } catch (err) {
    console.error("Scam report error:", err);
    return NextResponse.json({ error: "Failed to submit report." }, { status: 500 });
  }
}
