"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Zap, MinusCircle, Loader2 } from "lucide-react";

const plans = [
  {
    key:     "starter",
    name:    "Starter",
    tag:     null,
    price:   "$2.99",
    period:  "per check",
    overage: null,
    desc:    "Pay only when you need it. No subscription, no commitment.",
    cta:     "Buy a check",
    highlight: false,
    features: [
      { text: "Basic trust score",                    included: true  },
      { text: "Verdict badge (BUY / CAUTION / SKIP)", included: true  },
      { text: "Review summary",                       included: true  },
      { text: "Key pros & cons",                      included: true  },
      { text: "Price comparison",                     included: false },
      { text: "Return risk analysis",                 included: false },
      { text: "Red flag breakdown",                   included: false },
      { text: "Facebook page check",                  included: false },
      { text: "Report history",                       included: false },
    ],
  },
  {
    key:     "personal",
    name:    "Personal",
    tag:     "Most popular",
    price:   "$19.99",
    period:  "per month",
    overage: "$1.25 / check after 10",
    desc:    "10 checks included. Full advanced reports every time.",
    cta:     "Start Personal — $19.99/mo",
    highlight: true,
    features: [
      { text: "10 checks / month included",           included: true },
      { text: "Full trust score breakdown",           included: true },
      { text: "Verdict badge (BUY / CAUTION / SKIP)", included: true },
      { text: "Price comparison (Amazon & AliExpress)",included: true },
      { text: "Return risk analysis",                 included: true },
      { text: "Suspicious review detection",          included: true },
      { text: "Red flag breakdown",                   included: true },
      { text: "Facebook page check",                  included: true },
      { text: "Report history (saved)",               included: true },
    ],
  },
  {
    key:     "pro",
    name:    "Pro",
    tag:     null,
    price:   "$39.99",
    period:  "per month",
    overage: "$1.00 / check after 50",
    desc:    "50 checks included. Best value for power users & teams.",
    cta:     "Start Pro — $39.99/mo",
    highlight: false,
    features: [
      { text: "50 checks / month included",           included: true },
      { text: "Full trust score breakdown",           included: true },
      { text: "Verdict badge (BUY / CAUTION / SKIP)", included: true },
      { text: "Price comparison (Amazon & AliExpress)",included: true },
      { text: "Return risk analysis",                 included: true },
      { text: "Suspicious review detection",          included: true },
      { text: "Red flag breakdown",                   included: true },
      { text: "Facebook page check",                  included: true },
      { text: "Report history (saved)",               included: true },
    ],
  },
];

function usePlanCheckout() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function checkout(planKey: string) {
    setLoading(planKey);
    try {
      const res  = await fetch("/api/stripe/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan: planKey }),
      });
      const data = await res.json() as { url?: string; redirect?: string; error?: string };

      if (res.status === 401) {
        // Not logged in → go to login, come back to pricing
        router.push("/login?from=/#pricing");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(null);
    }
  }

  return { checkout, loading };
}

export function Pricing() {
  const { checkout, loading } = usePlanCheckout();

  return (
    <section id="pricing" className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center">
          <span
            className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest mb-5"
            style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}>
            Pricing
          </span>
          <h2 className="text-3xl font-bold sm:text-4xl">
            Simple, transparent{" "}
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #818cf8, #c084fc)" }}>
              pricing.
            </span>
          </h2>
          <p className="mt-4 text-gray-400 max-w-md mx-auto">
            Pay per check or save more with a monthly plan. No hidden fees.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-5 md:grid-cols-3 items-stretch">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="h-full">
              {plan.highlight ? (
                <div className="relative rounded-3xl p-[1px] h-full"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)" }}>
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full px-4 py-1 text-xs font-bold whitespace-nowrap z-10"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                    <Zap className="h-3 w-3" />
                    Most popular
                  </div>
                  <div className="flex h-full flex-col rounded-3xl p-8" style={{ background: "#0d0d1a" }}>
                    <PlanContent plan={plan} highlight loading={loading === plan.key} onCheckout={() => checkout(plan.key)} />
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col rounded-3xl p-8"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <PlanContent plan={plan} highlight={false} loading={loading === plan.key} onCheckout={() => checkout(plan.key)} />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-10 text-center text-xs text-gray-600">
          Secure checkout via Stripe · Cancel anytime · Checks never expire within the billing period
        </motion.p>
      </div>
    </section>
  );
}

function PlanContent({
  plan, highlight, loading, onCheckout,
}: {
  plan: (typeof plans)[0];
  highlight: boolean;
  loading: boolean;
  onCheckout: () => void;
}) {
  return (
    <>
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: highlight ? "#a5b4fc" : "#6b7280" }}>
          {plan.name}
        </div>
        <div className="flex items-end gap-1.5">
          <span className="text-4xl font-extrabold text-white">{plan.price}</span>
          <span className="mb-1.5 text-sm text-gray-500">/{plan.period}</span>
        </div>
        {plan.overage && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.18)", color: "#fbbf24" }}>
            then {plan.overage}
          </div>
        )}
        <p className="mt-3 text-sm text-gray-400 leading-relaxed">{plan.desc}</p>
      </div>

      <ul className="mb-8 flex-1 space-y-2.5">
        {plan.features.map(f => (
          <li key={f.text} className="flex items-center gap-2.5 text-sm"
            style={{ color: f.included ? "#d1d5db" : "#4b5563" }}>
            {f.included
              ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              : <MinusCircle  className="h-4 w-4 shrink-0 text-gray-700" />}
            {f.text}
          </li>
        ))}
      </ul>

      <button
        onClick={onCheckout}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        style={
          highlight
            ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff" }
            : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#d1d5db" }
        }>
        {loading
          ? <><Loader2 className="h-4 w-4 animate-spin" />Processing…</>
          : plan.cta}
      </button>
    </>
  );
}
