"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Zap, CheckCircle2, MinusCircle, Loader2, Crown, Sparkles,
  CreditCard, Calendar, ArrowUpRight, ShieldCheck,
} from "lucide-react";

// ── Plan config ───────────────────────────────────────────────────
const PLAN_INFO = {
  free:     { label: "Free",     color: "#9ca3af", checks: 0,  monthly: false },
  starter:  { label: "Starter",  color: "#60a5fa", checks: 0,  monthly: false },
  personal: { label: "Personal", color: "#a78bfa", checks: 10, monthly: true  },
  pro:      { label: "Pro",      color: "#f59e0b", checks: 50, monthly: true  },
} as const;

const UPGRADE_PLANS = [
  {
    key:       "starter",
    name:      "Starter",
    price:     "$2.99",
    period:    "per check",
    overage:   null,
    desc:      "Pay only when you need it. No commitment.",
    cta:       "Buy a check",
    color:     "#60a5fa",
    highlight: false,
    features: [
      { text: "Basic trust score + verdict", ok: true  },
      { text: "Key pros & cons",             ok: true  },
      { text: "Price comparison",            ok: false },
      { text: "Return risk analysis",        ok: false },
      { text: "Report history",              ok: false },
    ],
  },
  {
    key:       "personal",
    name:      "Personal",
    price:     "$19.99",
    period:    "/ month",
    overage:   "then $1.25 / check",
    desc:      "10 full checks/month. All advanced features.",
    cta:       "Start Personal",
    color:     "#a78bfa",
    highlight: true,
    features: [
      { text: "10 checks / month",           ok: true },
      { text: "Full trust score breakdown",  ok: true },
      { text: "Price comparison",            ok: true },
      { text: "Return risk analysis",        ok: true },
      { text: "Report history (saved)",      ok: true },
    ],
  },
  {
    key:       "pro",
    name:      "Pro",
    price:     "$39.99",
    period:    "/ month",
    overage:   "then $1.00 / check",
    desc:      "50 checks/month. Best for power users & teams.",
    cta:       "Start Pro",
    color:     "#f59e0b",
    highlight: false,
    features: [
      { text: "50 checks / month",           ok: true },
      { text: "Full trust score breakdown",  ok: true },
      { text: "Price comparison",            ok: true },
      { text: "Return risk analysis",        ok: true },
      { text: "Report history (saved)",      ok: true },
    ],
  },
] as const;

interface Props {
  plan: string;
  checksRemaining: number;
  billingPeriodEnd: string | null;
  hasStripeSubscription: boolean;
}

export function BillingDashboard({ plan, checksRemaining, billingPeriodEnd, hasStripeSubscription }: Props) {
  const router = useRouter();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading,   setPortalLoading]   = useState(false);

  const info       = PLAN_INFO[plan as keyof typeof PLAN_INFO] ?? PLAN_INFO.free;
  const isPaid     = plan !== "free";
  const totalChecks = info.checks;
  const usedChecks  = Math.max(0, totalChecks - checksRemaining);
  const pct         = totalChecks > 0 ? Math.round((usedChecks / totalChecks) * 100) : 0;

  function handleCheckout(planKey: string) {
    setCheckoutLoading(planKey);
    router.push(`/checkout/pay?plan=${planKey}`);
  }

  function handlePortal() {
    router.push("/dashboard/billing/manage");
  }

  return (
    <div className="space-y-8">

      {/* ── Current Plan Card ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="rounded-3xl p-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl shrink-0"
              style={{ background: `${info.color}18`, border: `1px solid ${info.color}30` }}>
              {isPaid ? <Crown className="h-5 w-5" style={{ color: info.color }} />
                      : <ShieldCheck className="h-5 w-5 text-gray-600" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{info.label} Plan</h2>
                {isPaid && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: `${info.color}18`, color: info.color }}>Active</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {isPaid ? `${checksRemaining} of ${totalChecks} checks remaining this period` : "No active plan — upgrade to get started"}
              </p>
            </div>
          </div>

          {hasStripeSubscription && (
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              style={{ border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.04)" }}>
              {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
              Manage subscription
              {!portalLoading && <ArrowUpRight className="h-3 w-3" />}
            </button>
          )}
        </div>

        {/* Usage bar (monthly plans only) */}
        {info.monthly && totalChecks > 0 && (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-gray-600 mb-1.5">
              <span>{usedChecks} used</span>
              <span>{checksRemaining} left</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: pct >= 80
                    ? "linear-gradient(90deg, #f87171, #ef4444)"
                    : "linear-gradient(90deg, #6366f1, #8b5cf6)",
                }}
              />
            </div>
            {billingPeriodEnd && (
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-600">
                <Calendar className="h-3 w-3" />
                Renews {new Date(billingPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </div>
            )}
          </div>
        )}

        {/* Free plan CTA */}
        {!isPaid && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl px-4 py-3"
            style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <Zap className="h-4 w-4 text-violet-400 shrink-0" />
            <p className="text-xs text-gray-400">
              You&apos;re on the free plan. Choose a plan below to start checking stores.
            </p>
          </div>
        )}
      </motion.div>

      {/* ── Plan Options ──────────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-4">
          {isPaid ? "Change plan" : "Choose a plan"}
        </h3>

        <div className="grid gap-4 sm:grid-cols-3">
          {UPGRADE_PLANS.map((p, i) => {
            const isCurrent = p.key === plan;
            return (
              <motion.div
                key={p.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="relative rounded-2xl p-5 flex flex-col"
                style={
                  p.highlight
                    ? { background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.3)" }
                    : { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }
                }>

                {p.highlight && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full px-3 py-0.5 text-[10px] font-bold"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                    <Sparkles className="h-2.5 w-2.5" />
                    Most popular
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: p.color }}>{p.name}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-extrabold text-white">{p.price}</span>
                    <span className="text-xs text-gray-600 mb-0.5">{p.period}</span>
                  </div>
                  {p.overage && <p className="text-[10px] text-gray-600 mt-0.5">{p.overage}</p>}
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">{p.desc}</p>
                </div>

                <ul className="space-y-1.5 flex-1 mb-4">
                  {p.features.map(f => (
                    <li key={f.text} className="flex items-center gap-2 text-[11px]"
                      style={{ color: f.ok ? "#d1d5db" : "#4b5563" }}>
                      {f.ok
                        ? <CheckCircle2 className="h-3 w-3 shrink-0 text-green-500" />
                        : <MinusCircle  className="h-3 w-3 shrink-0 text-gray-700" />}
                      {f.text}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-gray-600"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    Current plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleCheckout(p.key)}
                    disabled={checkoutLoading === p.key}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                    style={
                      p.highlight
                        ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff" }
                        : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#d1d5db" }
                    }>
                    {checkoutLoading === p.key
                      ? <><Loader2 className="h-3 w-3 animate-spin" />Processing…</>
                      : p.cta}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-[10px] text-gray-700 mt-4">
          Secure checkout via Stripe · Cancel anytime · No hidden fees
        </p>
      </div>
    </div>
  );
}
