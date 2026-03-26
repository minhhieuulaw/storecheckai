import { NextRequest, NextResponse } from "next/server";
import { verifySession, findUserById, type User } from "./auth";

type AuthResult =
  | { user: User; error: null }
  | { user: null; error: NextResponse };

/**
 * Reads the session cookie from a request, verifies it, loads the user row,
 * and optionally enforces the ban check.
 *
 * Usage:
 *   const { user, error } = await getAuthUser(req);
 *   if (error) return error;
 */
export async function getAuthUser(req: NextRequest, options: { requireUnbanned?: boolean } = {}): Promise<AuthResult> {
  const { requireUnbanned = true } = options;
  const token = req.cookies.get("session")?.value;
  if (!token) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const session = await verifySession(token);
  if (!session?.sub) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = await findUserById(session.sub);
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }
  if (requireUnbanned && user.isBanned) {
    return { user: null, error: NextResponse.json({ error: "Your account has been suspended. Please contact support." }, { status: 403 }) };
  }
  return { user, error: null };
}
