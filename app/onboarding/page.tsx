"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, ArrowRight, CheckCircle2, Sparkles,
  Zap, Star, CreditCard, Loader2,
} from "lucide-react";

const STEPS = ["Welcome", "Choose a plan", "Start checking"];

function StepDot({ idx, current }: { idx: number; current: number }) {
  const done   = idx < current;
  const active = idx === current;
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all"
        style={{
          background: done ? "rgba(74,222,128,0.15)" : active ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${done ? "rgba(74,222,128,0.4)" : active ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}`,
          color: done ? "#4ade80" : active ? "#a5b4fc" : "#6b7280",
        }}>
        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
      </div>
      <span className="text-xs hidden sm:block"
        style={{ color: active ? "#d1d5db" : done ? "#4ade80" : "#6b7280" }}>
        {STEPS[idx]}
      </span>
    </div>
  );
}

const PLANS = [
  {
    key:       "starter",
    name:      "Starter",
    price:     "$2.99",
    period:    "per check",
    desc:      "Pay as you go. Perfect for occasional shoppers.",
    icon:      Zap,
    color:     "#60a5fa",
    highlight: false,
    perks:     ["1 full store report", "Trust score + verdict", "Review analysis"],
  },
  {
    key:       "personal",
    name:      "Personal",
    price:     "$19.99",
    period:    "/ month",
    desc:      "10 checks/month. Best for regular online shoppers.",
    icon:      Star,
    color:     "#a78bfa",
    highlight: true,
    tag:       "Most popular",
    perks:     ["10 checks per month", "Full AI report", "Price comparison", "Return risk analysis"],
  },
  {
    key:       "pro",
    name:      "Pro",
    price:     "$39.99",
    period:    "/ month",
    desc:      "50 checks/month for power shoppers & resellers.",
    icon:      Shield,
    color:     "#f59e0b",
    highlight: false,
    perks:     ["50 checks per month", "Everything in Personal", "$1.00 per extra check"],
  },
];

export default function OnboardingPage() {
  const router  = useRouter();
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/settings").catch(() => {});
  }, []);

  async function handleCheckout(planKey: string) {
    setLoading(planKey);
    try {
      const res  = await fetch("/api/stripe/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan: planKey }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else router.push("/dashboard/billing");
    } catch {
      router.push("/dashboard/billing");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "#07070f" }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
          <Shield className="h-5 w-5 text-white" />
        </div>
        <span className="text-base font-bold text-white tracking-tight">StorecheckAI</span>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-3 mb-10">
        {STEPS.map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <StepDot idx={i} current={step} />
            {i < STEPS.length - 1 && (
              <div className="h-px w-8 sm:w-14 rounded-full"
                style={{ background: i < step ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.08)" }} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <motion.div key="welcome"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="max-w-md w-full text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl mx-auto mb-6"
              style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}>
              <Sparkles className="h-8 w-8 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Welcome to StorecheckAI</h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Analyze any online store before you buy. Our AI checks 20+ trust signals
              so you never get scammed again.
            </p>
            <div className="space-y-3 mb-8 text-left">
              {[
                "Trustpilot review authenticity",
                "Price comparison vs Amazon",
                "Return policy risk level",
                "Red flags & suspicious patterns",
              ].map(item => (
                <div key={item} className="flex items-center gap-3 text-sm text-gray-300">
                  <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <motion.button
              onClick={() => setStep(1)}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              Get started <ArrowRight className="h-4 w-4" />
            </motion.button>
            <button onClick={() => router.push("/dashboard")}
              className="mt-3 w-full py-2.5 text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Skip for now
            </button>
          </motion.div>
        )}

        {/* Step 1 — Choose plan */}
        {step === 1 && (
          <motion.div key="plan"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="w-full max-w-3xl">
            <div className="text-center mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl mx-auto mb-4"
                style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}>
                <CreditCard className="h-7 w-7 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Choose your plan</h2>
              <p className="text-sm text-gray-500">Pick how many checks you need. You can upgrade anytime.</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              {PLANS.map(plan => {
                const Icon = plan.icon;
                return (
                  <motion.div key={plan.key} whileHover={{ y: -2 }}
                    className="relative flex flex-col rounded-2xl p-5"
                    style={{
                      background: plan.highlight ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${plan.highlight ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.08)"}`,
                    }}>
                    {plan.tag && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[11px] font-bold text-white whitespace-nowrap"
                        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                        {plan.tag}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{ background: `${plan.color}15`, border: `1px solid ${plan.color}30` }}>
                        <Icon className="h-3.5 w-3.5" style={{ color: plan.color }} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: plan.color }}>{plan.name}</span>
                    </div>
                    <div className="mb-3">
                      <span className="text-2xl font-extrabold text-white">{plan.price}</span>
                      <span className="text-xs text-gray-500 ml-1">{plan.period}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">{plan.desc}</p>
                    <ul className="space-y-1.5 mb-5 flex-1">
                      {plan.perks.map(p => (
                        <li key={p} className="flex items-center gap-2 text-xs text-gray-400">
                          <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />{p}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleCheckout(plan.key)}
                      disabled={!!loading}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                      style={plan.highlight
                        ? { background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }
                        : { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                      {loading === plan.key
                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Processing…</>
                        : <>Get {plan.name} <ArrowRight className="h-3 w-3" /></>}
                    </button>
                  </motion.div>
                );
              })}
            </div>

            <p className="text-center text-[11px] text-gray-600 mb-3">
              Secure payment via Stripe · Cancel anytime
            </p>
            <button onClick={() => router.push("/dashboard")}
              className="block w-full text-center py-2 text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Skip for now — go to dashboard
            </button>
          </motion.div>
        )}

        {/* Step 2 — Done (after Stripe redirect back) */}
        {step === 2 && (
          <motion.div key="done"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="flex h-16 w-16 items-center justify-center rounded-full mx-auto mb-5"
              style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)" }}>
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </motion.div>
            <h2 className="text-xl font-bold text-white mb-2">You&apos;re all set!</h2>
            <p className="text-sm text-gray-400 mb-7">
              Your checks are ready. Paste any store URL in your dashboard to get started.
            </p>
            <motion.a href="/dashboard"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              Go to dashboard <ArrowRight className="h-4 w-4" />
            </motion.a>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
