"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, CheckCircle2, MinusCircle, Loader2, Crown, Sparkles } from "lucide-react";

const PLANS = [
  {
    key:      "starter",
    name:     "Starter",
    price:    "$2.99",
    period:   "per check",
    overage:  null,
    desc:     "Full report, no subscription.",
    cta:      "Buy 1 check — $2.99",
    color:    "#60a5fa",
    features: [
      { text: "Full trust score breakdown",    ok: true  },
      { text: "Verdict + pros & cons",         ok: true  },
      { text: "Price comparison",              ok: true  },
      { text: "Return risk analysis",          ok: true  },
      { text: "Red flag breakdown",            ok: true  },
      { text: "Report history (saved)",        ok: false },
    ],
  },
  {
    key:      "personal",
    name:     "Personal",
    price:    "$19.99",
    period:   "/ month",
    overage:  null,
    desc:     "10 full checks/month. Most popular.",
    cta:      "Start Personal — $19.99/mo",
    color:    "#a78bfa",
    highlight: true,
    features: [
      { text: "10 checks / month",             ok: true },
      { text: "Full trust score breakdown",    ok: true },
      { text: "Price comparison",              ok: true },
      { text: "Return risk analysis",          ok: true },
      { text: "Red flag breakdown",            ok: true },
      { text: "Report history (saved)",        ok: true },
    ],
  },
  {
    key:      "pro",
    name:     "Pro",
    price:    "$39.99",
    period:   "/ month",
    overage:  null,
    desc:     "50 checks/month. Best for power users.",
    cta:      "Start Pro — $39.99/mo",
    color:    "#f59e0b",
    features: [
      { text: "50 checks / month",             ok: true },
      { text: "Full trust score breakdown",    ok: true },
      { text: "Price comparison",              ok: true },
      { text: "Return risk analysis",          ok: true },
      { text: "Red flag breakdown",            ok: true },
      { text: "Report history (saved)",        ok: true },
    ],
  },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  reason?: "quota" | "upgrade"; // quota = ran out, upgrade = voluntary
}

export function UpgradeModal({ open, onClose, reason = "upgrade" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  function handleCheckout(plan: string) {
    setLoading(plan);
    onClose();
    router.push(`/checkout/pay?plan=${plan}`);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 pointer-events-none overflow-y-auto">

            <div className="relative w-full max-w-3xl rounded-3xl p-4 sm:p-7 pointer-events-auto"
              style={{
                background: "#0d0d1a",
                border: "1px solid rgba(139,92,246,0.25)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 40px 100px rgba(0,0,0,0.8), 0 0 120px rgba(99,102,241,0.06)",
              }}>

              {/* Close */}
              <button onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-600 hover:text-gray-300 transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}>
                <X className="h-4 w-4" />
              </button>

              {/* Header */}
              <div className="mb-6 text-center">
                {reason === "quota" ? (
                  /* ── Emotional out-of-checks header ── */
                  <div>
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl mb-4"
                      style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 0 28px rgba(239,68,68,0.35)" }}>
                      <Zap className="h-6 w-6 text-white" />
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2">
                      You&apos;re out of checks — don&apos;t shop blind
                    </h2>

                    {/* Emotional hook strip */}
                    <div className="mx-auto max-w-sm rounded-2xl px-4 py-3 mb-3"
                      style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
                      <p className="text-sm text-red-300 leading-relaxed">
                        Every year, Americans lose{" "}
                        <span className="font-bold text-red-200">$8 billion</span>{" "}
                        to fake and low-quality products. Without a check, your next order could be next.
                      </p>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                      Don&apos;t let your family get burned by another sketchy store.
                      One check is all it takes to shop with confidence.
                    </p>
                  </div>
                ) : (
                  /* ── Standard upgrade header ── */
                  <div>
                    <div className="inline-flex items-center justify-center h-11 w-11 rounded-2xl mb-3"
                      style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 24px rgba(99,102,241,0.3)" }}>
                      <Crown className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Upgrade your plan</h2>
                    <p className="text-sm text-gray-500 mt-1">Get more checks and unlock advanced features.</p>
                  </div>
                )}
              </div>

              {/* Plan cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PLANS.map(plan => (
                  <div key={plan.key}
                    className="relative rounded-2xl p-5 flex flex-col"
                    style={
                      "highlight" in plan && plan.highlight
                        ? { background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.35)" }
                        : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }
                    }>

                    {"highlight" in plan && plan.highlight && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full px-3 py-0.5 text-[10px] font-bold"
                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                        <Sparkles className="h-2.5 w-2.5" />
                        Most popular
                      </div>
                    )}

                    <div className="mb-4">
                      <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: plan.color }}>{plan.name}</p>
                      <div className="flex items-end gap-1">
                        <span className="text-2xl font-extrabold text-white">{plan.price}</span>
                        <span className="text-xs text-gray-600 mb-0.5">{plan.period}</span>
                      </div>
                      {plan.overage && (
                        <p className="text-[10px] text-gray-600 mt-0.5">{plan.overage}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">{plan.desc}</p>
                    </div>

                    <ul className="space-y-1.5 mb-4 flex-1">
                      {plan.features.map(f => (
                        <li key={f.text} className="flex items-center gap-2 text-[11px]"
                          style={{ color: f.ok ? "#d1d5db" : "#4b5563" }}>
                          {f.ok
                            ? <CheckCircle2 className="h-3 w-3 shrink-0 text-green-500" />
                            : <MinusCircle  className="h-3 w-3 shrink-0 text-gray-700" />}
                          {f.text}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleCheckout(plan.key)}
                      disabled={loading === plan.key}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                      style={
                        "highlight" in plan && plan.highlight
                          ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff" }
                          : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#d1d5db" }
                      }>
                      {loading === plan.key
                        ? <><Loader2 className="h-3 w-3 animate-spin" />Processing…</>
                        : plan.cta}
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-center text-[10px] text-gray-700 mt-4">
                Secure checkout via Stripe · Cancel anytime · No hidden fees
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
