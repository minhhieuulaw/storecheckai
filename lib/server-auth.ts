import { cookies } from "next/headers";
import { verifySession, findUserById } from "./auth";
import type { User, SessionPayload } from "./auth";

export async function getServerSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function getServerUser(): Promise<User | null> {
  const session = await getServerSession();
  if (!session?.sub) return null;
  return findUserById(session.sub);
}
