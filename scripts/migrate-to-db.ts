/**
 * One-time migration: JSON files → Neon Postgres
 * Run: npx tsx scripts/migrate-to-db.ts
 *
 * Prerequisites:
 *   1. DATABASE_URL set in .env.local
 *   2. npx drizzle-kit push  (create tables first)
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { db } from "../lib/db";
import { users, reports } from "../lib/schema";

async function main() {
  // ── Migrate users ────────────────────────────────────────────────
  const usersFile = path.join(process.cwd(), "data", "users.json");
  if (fs.existsSync(usersFile)) {
    const rawUsers = JSON.parse(fs.readFileSync(usersFile, "utf-8")) as Array<{
      id: string; email: string; name: string; passwordHash: string; createdAt: string;
    }>;
    for (const u of rawUsers) {
      try {
        await db.insert(users).values({
          id: u.id, email: u.email, name: u.name, passwordHash: u.passwordHash,
          plan: "personal", checksRemaining: 3, createdAt: u.createdAt,
        }).onConflictDoNothing();
        console.log(`✓ User migrated: ${u.email}`);
      } catch (e) {
        console.error(`✗ User failed: ${u.email}`, e);
      }
    }
  } else {
    console.log("No data/users.json found — skipping user migration");
  }

  // ── Build email→id map ───────────────────────────────────────────
  const { eq } = await import("drizzle-orm");
  const allUsers = await db.select({ id: users.id, email: users.email }).from(users);
  const emailToId: Record<string, string> = {};
  for (const u of allUsers) emailToId[u.email.toLowerCase()] = u.id;

  // ── Migrate reports ──────────────────────────────────────────────
  const reportsDir = path.join(process.cwd(), ".reports");
  if (fs.existsSync(reportsDir)) {
    const files = fs.readdirSync(reportsDir).filter(f => f.endsWith(".json"));
    for (const file of files) {
      try {
        const report = JSON.parse(fs.readFileSync(path.join(reportsDir, file), "utf-8"));
        // Old reports stored email as userId; resolve to actual UUID
        const resolvedUserId = report.userId
          ? (emailToId[report.userId.toLowerCase()] ?? null)
          : null;
        await db.insert(reports).values({
          id: report.id, userId: resolvedUserId, url: report.url,
          domain: report.domain, storeName: report.storeName, analyzedAt: report.analyzedAt,
          trustScore: report.trustScore, verdict: report.verdict, returnRisk: report.returnRisk,
          reviewConfidence: report.reviewConfidence, planUsed: "personal",
          reportData: { ...report, userId: resolvedUserId },
        }).onConflictDoNothing();
        console.log(`✓ Report migrated: ${report.id}`);
      } catch (e) {
        console.error(`✗ Report failed: ${file}`, (e as Error).message?.slice(0, 120));
      }
    }
  } else {
    console.log("No .reports/ directory found — skipping report migration");
  }

  console.log("\n✅ Migration complete!");
}

main().catch(console.error);
