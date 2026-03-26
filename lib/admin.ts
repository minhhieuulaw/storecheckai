import { sql, eq, desc, count, and } from "drizzle-orm";
import { db } from "./db";
import { users, reports, settings } from "./schema";
import type { SessionPayload } from "./auth";
import { verifySession } from "./auth";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

// ── Admin identity check ────────────────────────────────────────────────────────

export function isAdminEmail(email: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL ?? "";
  return adminEmail.length > 0 && email.toLowerCase() === adminEmail.toLowerCase();
}

export async function requireAdminSession(req?: NextRequest): Promise<SessionPayload> {
  // Prefer req.cookies (Route Handler context) over next/headers cookies() (Server Component context)
  const token = req
    ? req.cookies.get("session")?.value
    : (await cookies()).get("session")?.value;
  if (!token) throw new Error("UNAUTHORIZED");
  const session = await verifySession(token);
  if (!session?.email) throw new Error("UNAUTHORIZED");
  if (!isAdminEmail(session.email)) throw new Error("FORBIDDEN");
  return session;
}

// ── Stats ───────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  usersToday: number;
  usersThisWeek: number;
  usersThisMonth: number;
  byPlan: Record<string, number>;
  bannedUsers: number;
  totalReports: number;
  reportsToday: number;
  estimatedMRR: number;          // USD cents
  recentUsers: RecentUser[];
}

export interface RecentUser {
  id: string;
  email: string;
  name: string;
  plan: string;
  checksRemaining: number;
  createdAt: string;
  isBanned: boolean;
}

const PLAN_PRICE_CENTS: Record<string, number> = {
  personal: 1999,
  pro:      3999,
};

export async function getAdminStats(): Promise<AdminStats> {
  const now     = new Date();
  const todayStr = now.toISOString().slice(0, 10);          // YYYY-MM-DD
  const weekAgo  = new Date(now.getTime() - 7  * 86400_000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 86400_000).toISOString();

  // Parallel SQL queries — no in-memory filtering of full user table
  const [
    countRows,
    recentUserRows,
    todayReportRows,
    planDistRows,
  ] = await Promise.all([
    // Aggregate counts in one query
    db.execute(sql`
      SELECT
        COUNT(*)                                                        AS total,
        COUNT(*) FILTER (WHERE created_at >= ${todayStr})              AS today,
        COUNT(*) FILTER (WHERE created_at >= ${weekAgo})               AS week,
        COUNT(*) FILTER (WHERE created_at >= ${monthAgo})              AS month,
        COUNT(*) FILTER (WHERE is_banned = true)                       AS banned,
        COUNT(reports.id)                                              AS total_reports
      FROM users
      LEFT JOIN reports ON true
      LIMIT 1
    `),
    // Recent 20 users for display
    db.select({
      id: users.id, email: users.email, name: users.name,
      plan: users.plan, checksRemaining: users.checksRemaining,
      createdAt: users.createdAt, isBanned: users.isBanned,
    }).from(users).orderBy(desc(users.createdAt)).limit(20),
    // Today's reports
    db.execute(sql`SELECT COUNT(*) AS cnt FROM reports WHERE analyzed_at >= ${todayStr}`),
    // Plan distribution
    db.execute(sql`SELECT plan, COUNT(*) AS cnt FROM users GROUP BY plan`),
  ]);

  // Total reports using simple count
  const totalReportCount = await db.select({ count: count() }).from(reports);

  const agg = countRows.rows[0] as Record<string, string>;
  const totalUsers     = Number(agg.total   ?? 0);
  const usersToday     = Number(agg.today   ?? 0);
  const usersThisWeek  = Number(agg.week    ?? 0);
  const usersThisMonth = Number(agg.month   ?? 0);
  const bannedUsers    = Number(agg.banned  ?? 0);

  const byPlan: Record<string, number> = {};
  for (const row of planDistRows.rows as Array<{ plan: string; cnt: string }>) {
    byPlan[row.plan] = Number(row.cnt);
  }

  let estimatedMRR = 0;
  for (const [plan, cnt] of Object.entries(byPlan)) {
    estimatedMRR += (PLAN_PRICE_CENTS[plan] ?? 0) * cnt;
  }

  const totalReports     = (totalReportCount[0] as { count: number }).count;
  const todayReportCount = Number((todayReportRows.rows[0] as { cnt: string })?.cnt ?? 0);

  const recentUsers: RecentUser[] = recentUserRows.map(u => ({
    id: u.id, email: u.email, name: u.name,
    plan: u.plan, checksRemaining: u.checksRemaining,
    createdAt: u.createdAt, isBanned: u.isBanned,
  }));

  return {
    totalUsers, usersToday, usersThisWeek, usersThisMonth,
    byPlan, bannedUsers, totalReports, reportsToday: todayReportCount,
    estimatedMRR, recentUsers,
  };
}

// ── User list ───────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  plan: string;
  checksRemaining: number;
  billingPeriodEnd: string | null;
  stripeCustomerId: string | null;
  createdAt: string;
  isBanned: boolean;
  reportCount: number;
}

export async function getAdminUsers(search?: string, page = 1, pageSize = 20): Promise<{ users: AdminUser[]; total: number }> {
  const offset = (page - 1) * pageSize;

  // Fetch all (small dataset) — add SQL search filter if provided
  const rows = search
    ? await db.execute(sql`
        SELECT u.id, u.email, u.name, u.plan, u.checks_remaining, u.billing_period_end,
               u.stripe_customer_id, u.created_at, u.is_banned,
               COUNT(r.id)::int AS report_count
        FROM users u
        LEFT JOIN reports r ON r.user_id = u.id
        WHERE u.email ILIKE ${'%' + search + '%'}
           OR u.name  ILIKE ${'%' + search + '%'}
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `)
    : await db.execute(sql`
        SELECT u.id, u.email, u.name, u.plan, u.checks_remaining, u.billing_period_end,
               u.stripe_customer_id, u.created_at, u.is_banned,
               COUNT(r.id)::int AS report_count
        FROM users u
        LEFT JOIN reports r ON r.user_id = u.id
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `);

  const countResult = search
    ? await db.execute(sql`SELECT COUNT(*) FROM users WHERE email ILIKE ${'%' + search + '%'} OR name ILIKE ${'%' + search + '%'}`)
    : await db.execute(sql`SELECT COUNT(*) FROM users`);

  const total = Number((countResult.rows[0] as { count: string })?.count ?? 0);

  const result: AdminUser[] = rows.rows.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    email: r.email as string,
    name: r.name as string,
    plan: r.plan as string,
    checksRemaining: r.checks_remaining as number,
    billingPeriodEnd: (r.billing_period_end as string) ?? null,
    stripeCustomerId: (r.stripe_customer_id as string) ?? null,
    createdAt: r.created_at as string,
    isBanned: (r.is_banned as boolean) ?? false,
    reportCount: (r.report_count as number) ?? 0,
  }));

  return { users: result, total };
}

// ── Maintenance mode ────────────────────────────────────────────────────────────

export interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  endsAt: string | null;   // ISO string or null = indefinite
}

const DEFAULT_MAINTENANCE: MaintenanceSettings = {
  enabled: false,
  message: "We're performing scheduled maintenance. We'll be back shortly.",
  endsAt:  null,
};

const MAINTENANCE_KEY = "maintenance";

export async function getMaintenanceMode(): Promise<MaintenanceSettings> {
  try {
    const rows = await db.select().from(settings).where(eq(settings.key, MAINTENANCE_KEY)).limit(1);
    if (!rows[0]) return DEFAULT_MAINTENANCE;
    return JSON.parse(rows[0].value) as MaintenanceSettings;
  } catch {
    return DEFAULT_MAINTENANCE;
  }
}

export async function setMaintenanceMode(data: MaintenanceSettings): Promise<void> {
  const value = JSON.stringify(data);
  await db.execute(sql`
    INSERT INTO settings (key, value) VALUES (${MAINTENANCE_KEY}, ${value})
    ON CONFLICT (key) DO UPDATE SET value = ${value}
  `);
}
