export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { verifySession, findUserById } from "@/lib/auth";
import { stripe, STRIPE_PLANS, type StripePlanKey } from "@/lib/stripe";
import { applyPlan } from "@/lib/quota";

/**
 * POST /api/stripe/sync-session
 * Fallback: apply plan if webhook hasn't fired yet.
 * Called from /checkout/success after payment completes.
 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session?.sub) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  let body: { sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { sessionId } = body;
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId." }, { status: 400 });
  }

  try {
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

    // Security: session must belong to this user
    if (stripeSession.metadata?.userId !== session.sub) {
      return NextResponse.json({ error: "Session mismatch." }, { status: 403 });
    }

    const plan = stripeSession.metadata?.plan as StripePlanKey | undefined;
    if (!plan || !STRIPE_PLANS[plan]) {
      return NextResponse.json({ applied: false, plan: null });
    }

    if (stripeSession.payment_status !== "paid") {
      return NextResponse.json({ applied: false, plan });
    }

    const user = await findUserById(session.sub);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Skip if webhook already applied this plan
    if (user.plan === plan) {
      return NextResponse.json({ applied: false, plan });
    }

    // Webhook hasn't applied it yet — apply now
    const cfg = STRIPE_PLANS[plan];
    if (stripeSession.mode === "payment") {
      await applyPlan(session.sub, cfg.plan, cfg.checks, null, stripeSession.customer as string);
    } else {
      const periodEnd = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();
      await applyPlan(
        session.sub, cfg.plan, cfg.checks, periodEnd,
        stripeSession.customer as string,
        stripeSession.subscription as string,
      );
    }

    return NextResponse.json({ applied: true, plan });
  } catch (err) {
    console.error("Sync session error:", err);
    return NextResponse.json({ error: "Failed to sync." }, { status: 500 });
  }
}
