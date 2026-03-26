"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Search, CheckCircle2, ArrowRight, Loader2, Sparkles } from "lucide-react";

const STEPS = ["Welcome", "Check a store", "Done"];

const EXAMPLE_STORES = [
  "trendyfinds-store.com",
  "urbanstyleclub.shop",
  "premiumdeals24.com",
];

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

export default function OnboardingPage() {
  const router  = useRouter();
  const [step,      setStep]    = useState(0);
  const [url,       setUrl]     = useState("");
  const [loading,   setLoading] = useState(false);
  const [error,     setError]   = useState("");
  const [reportId,  setReportId] = useState<string | null>(null);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const input = url.trim();
    if (!input) { setError("Please enter a store URL."); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/analyze", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ url: input }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Analysis failed."); return; }
      setReportId(data.reportId ?? data.id ?? null);
      setStep(2);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
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
              You can now analyze any online store in under 30 seconds.
              Our AI checks 20+ trust signals so you never get scammed again.
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              Let&apos;s check your first store
              <ArrowRight className="h-4 w-4" />
            </motion.button>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-3 w-full py-2.5 text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Skip for now
            </button>
          </motion.div>
        )}

        {/* Step 1 — Enter URL */}
        {step === 1 && (
          <motion.div key="check"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="max-w-md w-full">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl mx-auto mb-5"
              style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}>
              <Search className="h-7 w-7 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-white text-center mb-2">Check your first store</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Paste any online store URL — we&apos;ll analyze it in seconds.
            </p>

            <form onSubmit={handleAnalyze} className="space-y-3">
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://some-store.com"
                className="w-full rounded-2xl px-4 py-3.5 text-sm text-white placeholder-gray-600 outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                autoFocus
              />
              {error && (
                <p className="text-xs text-red-400 px-1">{error}</p>
              )}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Analyzing…</> : <><Search className="h-4 w-4" />Analyze now</>}
              </motion.button>
            </form>

            {/* Example stores */}
            <div className="mt-5">
              <p className="text-[11px] text-gray-600 mb-2 text-center">Or try an example:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {EXAMPLE_STORES.map(s => (
                  <button key={s} onClick={() => setUrl("https://" + s)}
                    className="rounded-xl px-3 py-1.5 text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
                    style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="mt-5 w-full py-2 text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Skip for now
            </button>
          </motion.div>
        )}

        {/* Step 2 — Done */}
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
            <h2 className="text-xl font-bold text-white mb-2">Report ready!</h2>
            <p className="text-sm text-gray-400 mb-7">
              Your first store analysis is complete. See the full AI-powered report now.
            </p>
            <div className="flex flex-col gap-3">
              {reportId && (
                <motion.a
                  href={`/report/${reportId}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  View full report
                  <ArrowRight className="h-4 w-4" />
                </motion.a>
              )}
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full py-3 text-sm text-gray-500 hover:text-gray-300 transition-colors rounded-2xl"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                Go to dashboard
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
