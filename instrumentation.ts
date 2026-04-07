export async function register() {
  // Auto-run critical DB migrations on startup (Node.js runtime only)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await runStartupMigrations();
    try { await import("./sentry.server.config"); } catch { /* Sentry optional */ }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    try { await import("./sentry.edge.config"); } catch { /* Sentry optional */ }
  }
}

async function runStartupMigrations() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return;

  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(dbUrl);

    // Migration: add role column if missing
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'`;
    console.log("[migrate] role column ensured");
  } catch (err) {
    console.error("[migrate] startup migration failed (non-fatal):", err);
  }
}

export async function onRequestError(
  ...args: Parameters<typeof import("@sentry/nextjs").captureRequestError>
) {
  try {
    const { captureRequestError } = await import("@sentry/nextjs");
    captureRequestError(...args);
  } catch { /* Sentry optional */ }
}
