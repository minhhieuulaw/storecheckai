export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { verifySession, findUserById, verifyPassword, hashPassword, updateUser, createSession, COOKIE_NAME, DISPLAY_COOKIE, SESSION_DAYS } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await verifySession(token);
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await findUserById(session.sub);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json() as { name?: string; currentPassword?: string; newPassword?: string };

  const updates: Parameters<typeof updateUser>[1] = {};

  if (body.name) {
    const trimmed = body.name.trim();
    if (trimmed.length < 2) return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
    updates.name = trimmed;
  }

  if (body.newPassword) {
    if (!body.currentPassword) return NextResponse.json({ error: "Current password required." }, { status: 400 });
    const valid = await verifyPassword(body.currentPassword, user.passwordHash);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    if (body.newPassword.length < 6) return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
    updates.passwordHash = await hashPassword(body.newPassword);
  }

  if (Object.keys(updates).length > 0) {
    await updateUser(user.id, updates);
  }

  const updatedName = updates.name ?? user.name;
  const newToken = await createSession({ sub: user.id, email: user.email, name: updatedName });
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  const isProduction = process.env.NODE_ENV === "production";

  const res = NextResponse.json({ success: true, name: updatedName });
  res.cookies.set(COOKIE_NAME, newToken, { httpOnly: true, secure: isProduction, sameSite: "strict", maxAge, path: "/" });
  res.cookies.set(DISPLAY_COOKIE, JSON.stringify({ email: user.email, name: updatedName }), { httpOnly: false, secure: isProduction, sameSite: "strict", maxAge, path: "/" });
  return res;
}
