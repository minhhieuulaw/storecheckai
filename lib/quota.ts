import { sql, eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "./schema";

export type PlanTier = "free" | "starter" | "personal" | "pro";

/** Features available per plan tier */
export const PLAN_FEATURES: Record<PlanTier, {
  fullReport: boolean;
  priceAnalysis: boolean;
  fbCheck: boolean;
  savedHistory: boolean;
  checksPerMonth: number;
  overagePerCheck: number | null;
}> = {
  free:     { fullReport: false, priceAnalysis: false, fbCheck: false, savedHistory: false, checksPerMonth: 0,  overagePerCheck: null },
  starter:  { fullReport: false, priceAnalysis: false, fbCheck: false, savedHistory: false, checksPerMonth: 0,  overagePerCheck: 2.99 },
  personal: { fullReport: true,  priceAnalysis: true,  fbCheck: true,  savedHistory: true,  checksPerMonth: 10, overagePerCheck: 1.25 },
  pro:      { fullReport: true,  priceAnalysis: true,  fbCheck: true,  savedHistory: true,  checksPerMonth: 50, overagePerCheck: 1.00 },
};

/**
 * Atomically consume 1 check from the user's quota.
 * Returns success=true if the check was granted, false if quota is exhausted.
 */
export async function useCheck(userId: string): Promise<{
  success: boolean;
  remaining: number;
  plan: PlanTier;
}> {
  // Atomic decrement — only succeeds if checks_remaining > 0
  const result = await db.execute(sql`
    UPDATE users
    SET checks_remaining = checks_remaining - 1
    WHERE id = ${userId} AND checks_remaining > 0
    RETURNING checks_remaining, plan
  `);

  if (!result.rows || result.rows.length === 0) {
    // Fetch current state to return accurate remaining count
    const rows = await db
      .select({ checksRemaining: users.checksRemaining, plan: users.plan })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return { success: false, remaining: rows[0]?.checksRemaining ?? 0, plan: (rows[0]?.plan ?? "free") as PlanTier };
  }

  const row = result.rows[0] as { checks_remaining: number; plan: string };
  return { success: true, remaining: row.checks_remaining, plan: row.plan as PlanTier };
}

/** Check quota without consuming */
export async function getQuota(userId: string): Promise<{ remaining: number; plan: PlanTier }> {
  const rows = await db
    .select({ checksRemaining: users.checksRemaining, plan: users.plan })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return {
    remaining: rows[0]?.checksRemaining ?? 0,
    plan: (rows[0]?.plan ?? "free") as PlanTier,
  };
}

/** Apply a new plan after successful Stripe payment */
export async function applyPlan(
  userId: string,
  plan: PlanTier,
  checks: number,
  billingPeriodEnd?: string | null,
  stripeCustomerId?: string | null,
  stripeSubscriptionId?: string | null,
): Promise<void> {
  await db.update(users).set({
    plan,
    checksRemaining:       checks,
    billingPeriodEnd:      billingPeriodEnd ?? null,
    stripeCustomerId:      stripeCustomerId ?? undefined,
    stripeSubscriptionId:  stripeSubscriptionId ?? undefined,
  }).where(eq(users.id, userId));
}

/** Reset checks on monthly renewal */
export async function renewChecks(userId: string, checks: number, billingPeriodEnd: string): Promise<void> {
  await db.update(users)
    .set({ checksRemaining: checks, billingPeriodEnd })
    .where(eq(users.id, userId));
}

/** Add checks (e.g. overage top-up) */
export async function addChecks(userId: string, count: number): Promise<void> {
  await db.update(users)
    .set({ checksRemaining: sql`${users.checksRemaining} + ${count}` })
    .where(eq(users.id, userId));
}
