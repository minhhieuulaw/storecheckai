import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { reports } from "./schema";
import type { Report } from "./types";

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
