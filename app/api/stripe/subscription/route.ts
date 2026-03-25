export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { verifySession, findUserById, updateUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

// GET — fetch subscription details
export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await findUserById(session.sub);
  if (!user?.stripeSubscriptionId) return NextResponse.json({ subscription: null });

  try {
    const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
      expand: ["default_payment_method", "latest_invoice"],
    });

    const pm = sub.default_payment_method as { card?: { brand: string; last4: string; exp_month: number; exp_year: number } } | null;

    return NextResponse.json({
      subscription: {
        id: sub.id,
        status: sub.status,
        plan: sub.metadata?.plan,
        currentPeriodEnd: (sub as unknown as Record<string, number>).current_period_end ?? null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        card: pm?.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        } : null,
      },
    });
  } catch {
    return NextResponse.json({ subscription: null });
  }
}

// DELETE — cancel subscription at period end
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await findUserById(session.sub);
  if (!user?.stripeSubscriptionId) return NextResponse.json({ error: "No subscription" }, { status: 404 });

  try {
    await stripe.subscriptions.update(user.stripeSubscriptionId, { cancel_at_period_end: true });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PATCH — reactivate cancelled subscription
export async function PATCH(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await findUserById(session.sub);
  if (!user?.stripeSubscriptionId) return NextResponse.json({ error: "No subscription" }, { status: 404 });

  try {
    await stripe.subscriptions.update(user.stripeSubscriptionId, { cancel_at_period_end: false });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
