import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, STRIPE_PLANS, type StripePlanKey } from "@/lib/stripe";
import { applyPlan, renewChecks } from "@/lib/quota";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {

      // ── One-time OR first subscription payment ─────────────────────
      case "checkout.session.completed": {
        const s       = event.data.object as Stripe.Checkout.Session;
        if (s.payment_status !== "paid") break;
        const userId  = s.metadata?.userId;
        const plan    = s.metadata?.plan as StripePlanKey | undefined;
        if (!userId || !plan || !STRIPE_PLANS[plan]) break;
        const cfg     = STRIPE_PLANS[plan];

        if (s.mode === "payment") {
          await applyPlan(userId, cfg.plan, cfg.checks, null, s.customer as string);
        } else {
          const periodEnd = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();
          await applyPlan(userId, cfg.plan, cfg.checks, periodEnd,
            s.customer as string, s.subscription as string);
        }
        break;
      }

      // ── Monthly renewal ────────────────────────────────────────────
      case "invoice.paid": {
        const inv = event.data.object as Stripe.Invoice;
        if ((inv as { billing_reason?: string }).billing_reason !== "subscription_cycle") break;
        const subId = (inv as { subscription?: string }).subscription;
        if (!subId) break;
        const sub     = await stripe.subscriptions.retrieve(subId);
        const plan    = sub.metadata?.plan as StripePlanKey | undefined;
        const userId  = sub.metadata?.userId;
        if (!userId || !plan || !STRIPE_PLANS[plan]) break;
        const rawSub    = sub as unknown as { current_period_end: number };
        const periodEnd = new Date(rawSub.current_period_end * 1000).toISOString();
        await renewChecks(userId, STRIPE_PLANS[plan].checks, periodEnd);
        break;
      }

      // ── Subscription cancelled ──────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub    = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;
        await db.update(users)
          .set({ plan: "free", stripeSubscriptionId: null, billingPeriodEnd: null })
          .where(eq(users.id, userId));
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
