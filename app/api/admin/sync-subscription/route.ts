import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_PLANS, type StripePlanKey } from "@/lib/stripe";
import { applyPlan } from "@/lib/quota";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

// One-time admin helper — sync a Stripe subscription to the DB
// POST /api/admin/sync-subscription  { subscriptionId: "sub_xxx" }
export async function POST(req: NextRequest) {
  // Basic security: only allow from localhost
  const host = req.headers.get("host") ?? "";
  if (!host.startsWith("localhost") && !host.startsWith("127.0.0.1")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { subscriptionId } = await req.json() as { subscriptionId?: string };
    if (!subscriptionId) return NextResponse.json({ error: "subscriptionId required" }, { status: 400 });

    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const plan    = sub.metadata?.plan as StripePlanKey | undefined;
    const userId  = sub.metadata?.userId;

    // If metadata missing, try to find user by customer ID
    let resolvedUserId = userId;
    if (!resolvedUserId) {
      const rows = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.stripeCustomerId, sub.customer as string))
        .limit(1);
      resolvedUserId = rows[0]?.id;
    }

    if (!resolvedUserId) return NextResponse.json({ error: "User not found for this subscription" }, { status: 404 });
    if (!plan || !STRIPE_PLANS[plan]) return NextResponse.json({ error: `Plan '${plan}' not found in config` }, { status: 400 });

    const cfg = STRIPE_PLANS[plan];
    // Stripe API >=2026: current_period_end may be on items or billing_cycle_anchor
    const raw = sub as unknown as Record<string, unknown>;
    const periodEndTs =
      (raw.current_period_end as number) ??
      (raw.billing_cycle_anchor as number) ??
      Math.floor(Date.now() / 1000) + 30 * 24 * 3600; // fallback: +30 days
    const periodEnd = new Date(periodEndTs * 1000).toISOString();

    await applyPlan(resolvedUserId, cfg.plan, cfg.checks, periodEnd, sub.customer as string, sub.id);

    return NextResponse.json({
      success: true,
      applied: { userId: resolvedUserId, plan: cfg.plan, checks: cfg.checks, periodEnd },
    });
  } catch (err) {
    console.error("sync-subscription error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
