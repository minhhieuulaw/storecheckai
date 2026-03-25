export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { verifySession, findUserById } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const token   = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await findUserById(session.sub);
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found." }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
  const body   = await req.json().catch(() => ({})) as { embedded?: boolean };

  if (body.embedded) {
    const portal = await stripe.billingPortal.sessions.create({
      customer:   user.stripeCustomerId,
      return_url: `${appUrl}/dashboard/billing`,
      ui_mode:    "embedded",
    });
    return NextResponse.json({ clientSecret: portal.client_secret });
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer:   user.stripeCustomerId,
    return_url: `${appUrl}/dashboard/billing`,
  });
  return NextResponse.json({ url: portal.url });
}
