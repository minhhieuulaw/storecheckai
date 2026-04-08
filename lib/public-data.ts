import { sql, desc, eq, count } from "drizzle-orm";
import { db } from "./db";
import { reports, scamReports } from "./schema";

export interface PublicStore {
  domain: string;
  storeName: string;
  trustScore: number;
  verdict: string;
  returnRisk: string;
  analyzedAt: string;
  reportId: string;
  checkCount: number;
}

export interface PublicStoreDetail {
  domain: string;
  storeName: string;
  trustScore: number;
  verdict: string;
  returnRisk: string;
  reviewConfidence: string;
  analyzedAt: string;
  reportId: string;
  checkCount: number;
  verdictReason: string;
  pros: string[];
  cons: string[];
  redFlags: string[];
  communityReportCount: number;
}

/**
 * Get paginated list of all analyzed stores (most recent report per domain).
 * Grouped by domain — shows latest analysis for each unique store.
 */
export async function getPublicStores(opts: {
  page?: number;
  pageSize?: number;
  verdict?: string;
  sort?: "newest" | "lowest" | "highest";
}): Promise<{ stores: PublicStore[]; total: number }> {
  const { page = 1, pageSize = 24, verdict, sort = "newest" } = opts;
  const offset = (page - 1) * pageSize;

  // Get latest report per domain with count
  let query = `
    SELECT DISTINCT ON (domain)
      domain, store_name, trust_score, verdict, return_risk,
      analyzed_at, id AS report_id
    FROM reports
  `;
  const conditions: string[] = [];
  if (verdict) conditions.push(`verdict = '${verdict}'`);
  if (conditions.length) query += ` WHERE ${conditions.join(" AND ")}`;

  query += ` ORDER BY domain, analyzed_at DESC`;

  // Wrap in subquery for sorting + pagination
  const orderCol = sort === "lowest" ? "trust_score ASC" : sort === "highest" ? "trust_score DESC" : "analyzed_at DESC";
  const fullQuery = `
    WITH latest AS (${query})
    SELECT *, (SELECT COUNT(*) FROM reports r2 WHERE r2.domain = latest.domain) AS check_count
    FROM latest
    ORDER BY ${orderCol}
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  const countQuery = verdict
    ? `SELECT COUNT(DISTINCT domain) AS cnt FROM reports WHERE verdict = '${verdict}'`
    : `SELECT COUNT(DISTINCT domain) AS cnt FROM reports`;

  const [rows, countRows] = await Promise.all([
    db.execute(sql.raw(fullQuery)),
    db.execute(sql.raw(countQuery)),
  ]);

  const stores: PublicStore[] = rows.rows.map((r: Record<string, unknown>) => ({
    domain: r.domain as string,
    storeName: r.store_name as string,
    trustScore: r.trust_score as number,
    verdict: r.verdict as string,
    returnRisk: r.return_risk as string,
    analyzedAt: r.analyzed_at as string,
    reportId: r.report_id as string,
    checkCount: Number(r.check_count ?? 1),
  }));

  const total = Number((countRows.rows[0] as { cnt: string })?.cnt ?? 0);
  return { stores, total };
}

/**
 * Get detailed public info for a specific domain — latest report + community data.
 */
export async function getPublicStoreByDomain(domain: string): Promise<PublicStoreDetail | null> {
  // Latest report for this domain
  const rows = await db.select()
    .from(reports)
    .where(eq(reports.domain, domain.toLowerCase()))
    .orderBy(desc(reports.analyzedAt))
    .limit(1);

  if (!rows[0]) return null;
  const r = rows[0];
  const reportData = r.reportData as Record<string, unknown>;

  // Count total checks for this domain
  const checkCountRows = await db.select({ count: count() })
    .from(reports)
    .where(eq(reports.domain, domain.toLowerCase()));
  const checkCount = (checkCountRows[0] as { count: number })?.count ?? 1;

  // Count community scam reports
  const scamCountRows = await db.select({ count: count() })
    .from(scamReports)
    .where(sql`${scamReports.domain} = ${domain.toLowerCase()} AND ${scamReports.status} = 'approved'`);
  const communityReportCount = (scamCountRows[0] as { count: number })?.count ?? 0;

  return {
    domain: r.domain,
    storeName: r.storeName,
    trustScore: r.trustScore,
    verdict: r.verdict,
    returnRisk: r.returnRisk,
    reviewConfidence: r.reviewConfidence,
    analyzedAt: r.analyzedAt,
    reportId: r.id,
    checkCount,
    verdictReason: (reportData.verdictReason as string) || "",
    pros: (reportData.pros as string[]) || [],
    cons: (reportData.cons as string[]) || [],
    redFlags: (reportData.redFlags as string[]) || [],
    communityReportCount,
  };
}

/**
 * Get all unique domains for sitemap generation.
 */
export async function getAllAnalyzedDomains(): Promise<string[]> {
  const rows = await db.execute(sql`SELECT DISTINCT domain FROM reports ORDER BY domain`);
  return rows.rows.map((r: Record<string, unknown>) => r.domain as string);
}

/**
 * Get stats for the database page header.
 */
export async function getDatabaseStats(): Promise<{
  totalStores: number;
  safeStores: number;
  cautionStores: number;
  riskyStores: number;
}> {
  const rows = await db.execute(sql`
    SELECT
      COUNT(DISTINCT domain) AS total,
      COUNT(DISTINCT domain) FILTER (WHERE verdict = 'BUY') AS safe,
      COUNT(DISTINCT domain) FILTER (WHERE verdict = 'CAUTION') AS caution,
      COUNT(DISTINCT domain) FILTER (WHERE verdict = 'SKIP') AS risky
    FROM (
      SELECT DISTINCT ON (domain) domain, verdict
      FROM reports
      ORDER BY domain, analyzed_at DESC
    ) latest
  `);
  const r = rows.rows[0] as Record<string, string>;
  return {
    totalStores: Number(r.total ?? 0),
    safeStores: Number(r.safe ?? 0),
    cautionStores: Number(r.caution ?? 0),
    riskyStores: Number(r.risky ?? 0),
  };
}
