"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { AnalyzingModal } from "@/components/AnalyzingModal";
import { LoginPromptModal } from "@/components/LoginPromptModal";

const tags = ["Shopify", "Amazon", "Walmart", "Etsy", "DTC Stores", "Temu"];

function isLoggedIn(): boolean {
  return document.cookie.split(";").some(c => c.trim().startsWith("user_display="));
}

export function Hero() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const router = useRouter();

  // Prefill URL if user comes back from login with a stored URL
  useEffect(() => {
    const saved = sessionStorage.getItem("pending_url");
    if (saved && isLoggedIn()) {
      sessionStorage.removeItem("pending_url");
      setUrl(saved);
    }
  }, []);

  async function handleAnalyze() {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please paste a store or product URL.");
      return;
    }
    setError("");

    // Not logged in → show prompt
    if (!isLoggedIn()) {
      sessionStorage.setItem("pending_url", trimmed);
      setShowLoginPrompt(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!data.success) {
        setLoading(false);
        setError(data.error || "Analysis failed. Please try again.");
        return;
      }
      router.push(`/report/${data.reportId}`);
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <>
    <AnalyzingModal url={url} open={loading} />
    <LoginPromptModal open={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
    <section id="hero" className="relative flex flex-col items-center justify-center overflow-hidden px-4 pb-28 pt-44 text-center">
      {/* Mesh gradient bg */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 80% 60% at 10% 30%, rgba(99,102,241,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 90% 60%, rgba(139,92,246,0.14) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 50% 100%, rgba(6,182,212,0.08) 0%, transparent 60%)",
        }} />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)" }}
        />
      </div>

      {/* Badge */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="mb-7 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm"
        style={{ background: "rgba(99,102,241,0.1)", borderColor: "rgba(99,102,241,0.35)", color: "#a5b4fc" }}>
        <Sparkles className="h-3.5 w-3.5" />
        AI Pre-Purchase Safety Check
        <span className="ml-1 flex h-1.5 w-1.5 rounded-full" style={{ background: "#6366f1", boxShadow: "0 0 8px #6366f1" }} />
      </motion.div>

      {/* Headline */}
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }}
        className="max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
        Is it safe to buy{" "}
        <span className="bg-clip-text text-transparent"
          style={{ backgroundImage: "linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)" }}>
          from this store?
        </span>
      </motion.h1>

      {/* Sub */}
      <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18 }}
        className="mt-6 max-w-xl text-lg leading-relaxed text-gray-400">
        Paste any product or store link. Get an AI safety report in 30 seconds — trust score, review analysis, return risk, and a clear verdict.
      </motion.p>

      {/* URL Input */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.26 }}
        className="mt-10 w-full max-w-2xl">
        <div className="flex flex-col gap-2 rounded-2xl p-2 transition-all duration-300"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: focused ? "1px solid rgba(99,102,241,0.6)" : "1px solid rgba(255,255,255,0.08)",
            boxShadow: focused ? "0 0 0 4px rgba(99,102,241,0.12), 0 0 40px rgba(99,102,241,0.08)" : "none",
          }}>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(""); }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleAnalyze()}
              placeholder="https://store.com/product/..."
              disabled={loading}
              className="flex-1 bg-transparent px-4 py-3 text-white placeholder-gray-600 outline-none text-sm disabled:opacity-50"
            />
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <span>Analyze this store</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        <p className="mt-3 text-xs text-gray-600">Sign up free · 1 check included · Results in &lt;30s</p>
      </motion.div>

      {/* Works with tags */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-gray-600">Works with</span>
        {tags.map((tag) => (
          <span key={tag} className="rounded-full border px-3 py-1 text-xs text-gray-500"
            style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
            {tag}
          </span>
        ))}
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55, duration: 0.5 }}
        className="mt-16 flex gap-12 text-center">
        {[
          { value: "50K+", label: "Stores analyzed" },
          { value: "30s", label: "Avg report time" },
          { value: "1", label: "Free check" },
        ].map((s) => (
          <div key={s.label}>
            <div className="text-2xl font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #c7d2fe, #e9d5ff)" }}>
              {s.value}
            </div>
            <div className="mt-1 text-xs text-gray-600">{s.label}</div>
          </div>
        ))}
      </motion.div>
    </section>
    </>
  );
}
