import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { reports } from "./schema";
import type { Report } from "./types";

// ── Estimated savings ──────────────────────────────────────────────────────────
// Based on BBB Scam Tracker 2023: median online shopping scam loss = $74
const MEDIAN_SCAM_LOSS_USD = 74;

export function calcEstimatedSavings(userReports: Report[]): {
  totalUsd: number;
  flaggedCount: number;
} {
  const flagged = userReports.filter(r =>
    r.verdict === "SKIP" ||
    (r.verdict === "CAUTION" && r.trustScore < 40),
  );

  const totalUsd = flagged.reduce((sum, r) => {
    // Prefer priceUsd (already converted to USD), fallback priceNumeric, then median
    const rawPrice = r.products?.[0]?.priceUsd ?? r.products?.[0]?.priceNumeric ?? 0;
    const estimate = rawPrice > 2 && rawPrice < 500 ? rawPrice : MEDIAN_SCAM_LOSS_USD;
    // CAUTION < 40 is less certain — weight 40%
    const weight   = r.verdict === "SKIP" ? 1.0 : 0.4;
    return sum + estimate * weight;
  }, 0);

  return { totalUsd: Math.round(totalUsd), flaggedCount: flagged.length };
}

export async function saveReport(report: Report): Promise<void> {
  await db.insert(reports).values({
    id:               report.id,
    userId:           report.userId ?? null,
    url:              report.url,
    domain:           report.domain,
    storeName:        report.storeName,
    analyzedAt:       report.analyzedAt,
    trustScore:       report.trustScore,
    verdict:          report.verdict,
    returnRisk:       report.returnRisk,
    reviewConfidence: report.reviewConfidence,
    planUsed:         report.planUsed ?? "free",
    reportData:       report as unknown as Record<string, unknown>,
  });
}

export async function getReport(id: string): Promise<Report | null> {
  const rows = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  if (!rows[0]) return null;
  return rows[0].reportData as unknown as Report;
}

export async function getUserReports(userId: string): Promise<Report[]> {
  const rows = await db
    .select()
    .from(reports)
    .where(eq(reports.userId, userId))
    .orderBy(desc(reports.analyzedAt));
  return rows.map(r => r.reportData as unknown as Report);
}
