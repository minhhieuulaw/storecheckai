import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  const checks: Record<string, string> = {
    status: "ok",
    ts: String(Date.now()),
    anthropic_key: process.env.ANTHROPIC_API_KEY ? "set" : "MISSING",
    openai_key: process.env.OPENAI_API_KEY ? "set" : "MISSING",
    auth_secret: process.env.AUTH_SECRET ? "set" : "MISSING",
    database_url: process.env.DATABASE_URL ? "set" : "MISSING",
    sentry_dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ? "set" : "not set",
  };

  // Check DB connectivity + role column
  if (process.env.DATABASE_URL) {
    try {
      const { db } = await import("@/lib/db");
      const result = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role'`);
      checks.db = "connected";
      checks.role_column = result.rows.length > 0 ? "exists" : "MISSING";
    } catch (err) {
      checks.db = `error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  const hasErrors = checks.anthropic_key === "MISSING" || checks.openai_key === "MISSING" || checks.auth_secret === "MISSING";

  return NextResponse.json(checks, { status: hasErrors ? 503 : 200 });
}
