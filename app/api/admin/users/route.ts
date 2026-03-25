export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, getAdminUsers } from "@/lib/admin";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession();
    const { searchParams } = req.nextUrl;
    const search   = searchParams.get("search") || undefined;
    const page     = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    const result = await getAdminUsers(search, page, pageSize);
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN")
      return NextResponse.json({ success: false, error: msg }, { status: msg === "FORBIDDEN" ? 403 : 401 });
    console.error("Admin users error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch users." }, { status: 500 });
  }
}
