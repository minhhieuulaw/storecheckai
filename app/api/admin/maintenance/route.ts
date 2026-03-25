export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, getMaintenanceMode, setMaintenanceMode } from "@/lib/admin";
import type { MaintenanceSettings } from "@/lib/admin";

export async function GET() {
  try {
    await requireAdminSession();
    const data = await getMaintenanceMode();
    return NextResponse.json({ success: true, maintenance: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN")
      return NextResponse.json({ success: false, error: msg }, { status: msg === "FORBIDDEN" ? 403 : 401 });
    return NextResponse.json({ success: false, error: "Failed." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession();
    const body = await req.json();
    const data: MaintenanceSettings = {
      enabled: Boolean(body.enabled),
      message: typeof body.message === "string" && body.message.trim()
        ? body.message.trim()
        : "We're performing scheduled maintenance. We'll be back shortly.",
      endsAt: typeof body.endsAt === "string" && body.endsAt ? body.endsAt : null,
    };
    await setMaintenanceMode(data);
    return NextResponse.json({ success: true, maintenance: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN")
      return NextResponse.json({ success: false, error: msg }, { status: msg === "FORBIDDEN" ? 403 : 401 });
    console.error("Admin maintenance error:", err);
    return NextResponse.json({ success: false, error: "Failed to update maintenance mode." }, { status: 500 });
  }
}
