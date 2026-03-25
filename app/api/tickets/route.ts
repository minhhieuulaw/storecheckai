export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await verifySession(token);
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(tickets)
    .where(eq(tickets.userId, session.sub))
    .orderBy(desc(tickets.createdAt));

  return NextResponse.json({ tickets: rows });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await verifySession(token);
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const subject = (body?.subject ?? "").trim().slice(0, 200);
  const message = (body?.message ?? "").trim().slice(0, 5000);

  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const id  = crypto.randomUUID();

  await db.insert(tickets).values({
    id,
    userId:    session.sub,
    subject,
    message,
    status:    "open",
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ success: true, id });
}
