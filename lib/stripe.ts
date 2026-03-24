import Stripe from "stripe";

// Lazy singleton — only throws at runtime when actually needed
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set.");
  }
  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
  });
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// ── Plan config — single source of truth ──────────────────────────
export const STRIPE_PLANS = {
  starter: {
    name:        "Starter Check",
    description: "1 basic store check — valid forever",
    price:       299,
    mode:        "payment"      as const,
    checks:      1,
    plan:        "starter"      as const,
    billing:     null,
  },
  personal: {
    name:        "Personal Plan",
    description: "10 full checks / month — advanced features",
    price:       1999,
    mode:        "subscription" as const,
    checks:      10,
    plan:        "personal"     as const,
    billing:     "month"        as const,
  },
  pro: {
    name:        "Pro Plan",
    description: "50 full checks / month — best value",
    price:       3999,
    mode:        "subscription" as const,
    checks:      50,
    plan:        "pro"          as const,
    billing:     "month"        as const,
  },
} as const;

export type StripePlanKey = keyof typeof STRIPE_PLANS;
