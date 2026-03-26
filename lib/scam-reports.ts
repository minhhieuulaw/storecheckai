import { eq, desc, and } from "drizzle-orm";
import { db } from "./db";
import { scamReports } from "./schema";
import type { ScamReportRow } from "./schema";

export type { ScamReportRow };
export type ScamReportStatus = "pending" | "approved" | "rejected";

export async function createScamReport(data: {
  userId: string;
  shopUrl: string;
  domain: string;
  content: string;
  images: string[];
}): Promise<ScamReportRow> {
  const id = crypto.randomUUID();
  const [row] = await db.insert(scamReports).values({
    id,
    userId:    data.userId,
    shopUrl:   data.shopUrl,
    domain:    data.domain.toLowerCase(),
    content:   data.content,
    images:    data.images,
    status:    "pending",
    createdAt: new Date().toISOString(),
  }).returning();
  return row;
}

export async function getAllScamReports(status?: ScamReportStatus): Promise<ScamReportRow[]> {
  if (status) {
    return db.select().from(scamReports)
      .where(eq(scamReports.status, status))
      .orderBy(desc(scamReports.createdAt));
  }
  return db.select().from(scamReports).orderBy(desc(scamReports.createdAt));
}

export async function getUserScamReports(userId: string): Promise<ScamReportRow[]> {
  return db.select().from(scamReports)
    .where(eq(scamReports.userId, userId))
    .orderBy(desc(scamReports.createdAt));
}

export async function getApprovedReportsForDomain(domain: string): Promise<ScamReportRow[]> {
  return db.select().from(scamReports)
    .where(and(
      eq(scamReports.domain, domain.toLowerCase()),
      eq(scamReports.status, "approved"),
    ))
    .orderBy(desc(scamReports.createdAt));
}

export async function reviewScamReport(
  id: string,
  status: "approved" | "rejected",
  adminNote?: string,
): Promise<void> {
  await db.update(scamReports).set({
    status,
    adminNote:  adminNote ?? null,
    reviewedAt: new Date().toISOString(),
  }).where(eq(scamReports.id, id));
}
