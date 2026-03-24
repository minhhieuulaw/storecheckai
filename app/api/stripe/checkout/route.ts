import { NextRequest, NextResponse } from "next/server";
import { verifySession, findUserById, updateUser } from "@/lib/auth";
import { stripe, STRIPE_PLANS, type StripePlanKey } from "@/lib/stripe";

// GET — success page fetches plan from completed session
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ plan: null });
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return NextResponse.json({ plan: session.metadata?.plan ?? null });
  } catch {
    return NextResponse.json({ plan: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token   = req.cookies.get("session")?.value;
    const session = token ? await verifySession(token) : null;
    if (!session?.sub) {
      return NextResponse.json({ error: "Login required.", redirect: "/login" }, { status: 401 });
    }

    const user = await findUserById(session.sub);
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    const { plan } = await req.json() as { plan?: StripePlanKey };
    if (!plan || !STRIPE_PLANS[plan]) {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }

    const cfg    = STRIPE_PLANS[plan];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

    // Ensure Stripe customer exists
    let customerId = user.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email, name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await updateUser(user.id, { stripeCustomerId: customerId });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer:   customerId,
      mode:       cfg.mode,
      line_items: [
        cfg.mode === "subscription"
          ? {
              price_data: {
                currency:     "usd",
                product_data: { name: cfg.name, description: cfg.description },
                unit_amount:  cfg.price,
                recurring:    { interval: cfg.billing! },
              },
              quantity: 1,
            }
          : {
              price_data: {
                currency:     "usd",
                product_data: { name: cfg.name, description: cfg.description },
                unit_amount:  cfg.price,
              },
              quantity: 1,
            },
      ],
      success_url:       `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:        `${appUrl}/#pricing`,
      metadata:          { userId: user.id, plan },
      subscription_data: cfg.mode === "subscription"
        ? { metadata: { userId: user.id, plan } }
        : undefined,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 });
  }
}
