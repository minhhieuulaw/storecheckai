"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [done,     setDone]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, email, password }),
      });
      const data = await res.json() as { success?: boolean; needsVerification?: boolean; error?: string };
      if (!data.success) { setError(data.error ?? "Registration failed."); return; }
      setDone(true);
      // Redirect to dashboard after short delay (banner will show there)
      setTimeout(() => { router.push("/dashboard"); router.refresh(); }, 2200);
    } catch {
      setError(t.auth.login.networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#07070f" }}>
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md">

        {/* Language switcher */}
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <a href="/" className="flex flex-col items-center gap-1 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl mb-3 transition-transform group-hover:scale-105"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 32px rgba(99,102,241,0.3)" }}>
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">StorecheckAI</h1>
          </a>
          <p className="text-sm text-gray-500 mt-1">{t.auth.register.subtitle}</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-5 sm:p-8"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(16px)" }}>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl mb-4"
                  style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}>
                  <Shield className="h-8 w-8 text-violet-400" />
                </div>
                <p className="text-xl font-bold text-white">Account created!</p>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-xs">
                  Check your inbox — we sent a verification link to claim your <span className="text-violet-400 font-medium">1 free check</span>.
                </p>
                <p className="text-xs text-gray-600 mt-3">Redirecting to dashboard…</p>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit} className="space-y-4" initial={{ opacity: 1 }}>

                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">{t.auth.register.nameLabel}</label>
                  <input
                    type="text" value={name} onChange={e => { setName(e.target.value); setError(null); }}
                    placeholder="John Doe" autoComplete="name" required disabled={loading}
                    className="w-full rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-700 outline-none transition-all disabled:opacity-50"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                    onBlur={e =>  { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">{t.auth.register.emailLabel}</label>
                  <input
                    type="email" value={email} onChange={e => { setEmail(e.target.value); setError(null); }}
                    placeholder="you@example.com" autoComplete="email" required disabled={loading}
                    className="w-full rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-700 outline-none transition-all disabled:opacity-50"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                    onBlur={e =>  { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">{t.auth.register.passwordLabel}</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"} value={password}
                      onChange={e => { setPassword(e.target.value); setError(null); }}
                      placeholder="Min. 6 characters" autoComplete="new-password" required disabled={loading}
                      className="w-full rounded-xl px-4 py-3 pr-11 text-sm text-gray-200 placeholder-gray-700 outline-none transition-all disabled:opacity-50"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                      onFocus={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                      onBlur={e =>  { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors p-2">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#f87171" }}>
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading || !name || !email || !password}
                  whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin" />{t.auth.register.submitting}</>
                    : t.auth.register.submit}
                </motion.button>

              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          {t.auth.register.hasAccount}{" "}
          <a href="/login" className="text-violet-500 hover:text-violet-400 transition-colors">{t.auth.register.signIn}</a>
        </p>
      </motion.div>
    </div>
  );
}
