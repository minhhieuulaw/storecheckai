"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Loader2, AlertCircle, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const { t, locale } = useTranslation();
  const fp = t.auth.forgotPassword;

  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [sent,    setSent]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim(), locale }),
      });
      // Always show success (avoid enumeration)
      setSent(true);
    } catch {
      setError(fp.networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#07070f" }}>
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <a href="/" className="flex flex-col items-center gap-1 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl mb-3 transition-transform group-hover:scale-105"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 32px rgba(99,102,241,0.3)" }}>
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">StorecheckAI</h1>
          </a>
          <p className="text-sm text-gray-500 mt-1">{fp.subtitle}</p>
        </div>

        <div className="rounded-3xl p-5 sm:p-8"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(16px)" }}>

          <AnimatePresence mode="wait">
            {sent ? (
              /* ── Success state ── */
              <motion.div key="success"
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-4">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)" }}>
                  <CheckCircle2 className="h-7 w-7" style={{ color: "#4ade80" }} />
                </div>
                <h2 className="text-base font-bold text-white mb-2">{fp.sentTitle}</h2>
                <p className="text-sm text-gray-400 leading-relaxed mb-6">{fp.sentDesc}</p>
                <a href="/login"
                  className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {fp.backToLogin}
                </a>
              </motion.div>
            ) : (
              /* ── Form state ── */
              <motion.form key="form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                    {fp.emailLabel}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(null); }}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      disabled={loading}
                      className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-gray-200 placeholder-gray-700 outline-none transition-all disabled:opacity-50"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                      onFocus={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                      onBlur={e =>  { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#f87171" }}>
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button type="submit" disabled={loading || !email}
                  whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin" />{fp.submitting}</>
                    : fp.submit}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {!sent && (
          <p className="text-center text-xs text-gray-600 mt-6">
            <a href="/login" className="inline-flex items-center gap-1 text-violet-500 hover:text-violet-400 transition-colors">
              <ArrowLeft className="h-3 w-3" />
              {fp.backToLogin}
            </a>
          </p>
        )}
      </motion.div>
    </div>
  );
}
