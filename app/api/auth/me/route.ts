import { NextRequest, NextResponse } from "next/server";
import { verifySession, findUserById } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ user: null });
  const session = await verifySession(token);
  if (!session?.sub) return NextResponse.json({ user: null });
  const user = await findUserById(session.sub);
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      email: user.email,
      name: user.name,
      plan: user.plan,
      checksRemaining: user.checksRemaining,
      createdAt: user.createdAt,
    },
  });
}
