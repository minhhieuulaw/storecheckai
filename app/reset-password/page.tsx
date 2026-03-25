"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

function PasswordStrength({ password }: { password: string }) {
  const has8  = password.length >= 8;
  const hasUp = /[A-Z]/.test(password);
  const hasLo = /[a-z]/.test(password);
  const hasNu = /[0-9]/.test(password);
  const score = [has8, hasUp, hasLo, hasNu].filter(Boolean).length;
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
  const labels = ["Weak", "Fair", "Good", "Strong"];
  if (!password) return null;
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex gap-1 flex-1">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? colors[score - 1] : "rgba(255,255,255,0.08)" }} />
        ))}
      </div>
      <span className="text-[10px] font-medium" style={{ color: colors[score - 1] || "#6b7280" }}>
        {labels[score - 1] || ""}
      </span>
    </div>
  );
}

function ResetForm() {
  const router       = useRouter();
  const params       = useSearchParams();
  const token        = params.get("token") ?? "";
  const { t }        = useTranslation();
  const rp           = t.auth.resetPassword;

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [showCf,    setShowCf]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState(false);

  const mismatch = confirm.length > 0 && password !== confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError(rp.mismatch); return; }
    if (password.length < 8)  { setError(rp.tooShort); return; }
    if (!token) { setError(rp.invalidToken); return; }

    setError(null);
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? rp.failed); return; }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError(rp.networkError);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-400">{rp.invalidToken}</p>
        <a href="/forgot-password" className="mt-3 inline-block text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          {rp.requestNew}
        </a>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {success ? (
        <motion.div key="success"
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center py-4">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <CheckCircle2 className="h-7 w-7" style={{ color: "#4ade80" }} />
          </div>
          <h2 className="text-base font-bold text-white mb-2">{rp.successTitle}</h2>
          <p className="text-sm text-gray-400">{rp.successDesc}</p>
        </motion.div>
      ) : (
        <motion.form key="form" onSubmit={handleSubmit} className="space-y-4">

          {/* New password */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              {rp.newPasswordLabel}
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null); }}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                disabled={loading}
                className="w-full rounded-xl px-4 py-3 pr-11 text-sm text-gray-200 placeholder-gray-700 outline-none transition-all disabled:opacity-50"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                onFocus={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                onBlur={e =>  { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors p-1">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              {rp.confirmLabel}
            </label>
            <div className="relative">
              <input
                type={showCf ? "text" : "password"}
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(null); }}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                disabled={loading}
                className="w-full rounded-xl px-4 py-3 pr-11 text-sm text-gray-200 placeholder-gray-700 outline-none transition-all disabled:opacity-50"
                style={{
                  background:  "rgba(255,255,255,0.05)",
                  border:      mismatch ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.09)",
                }}
                onFocus={e => { if (!mismatch) { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}}
                onBlur={e =>  { if (!mismatch) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; }}}
              />
              <button type="button" onClick={() => setShowCf(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors p-1">
                {showCf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {mismatch && <p className="mt-1 text-xs text-red-400">{rp.mismatch}</p>}
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

          <motion.button type="submit"
            disabled={loading || !password || !confirm || mismatch}
            whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />{rp.submitting}</> : rp.submit}
          </motion.button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const rp = t.auth.resetPassword;
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#07070f" }}>
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md">

        <div className="flex justify-end mb-4"><LanguageSwitcher /></div>

        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 32px rgba(99,102,241,0.3)" }}>
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">StorecheckAI</h1>
          <p className="text-sm text-gray-500 mt-1">{rp.subtitle}</p>
        </div>

        <div className="rounded-3xl p-8"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(16px)" }}>
          <Suspense fallback={<div className="h-32 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-500" /></div>}>
            <ResetForm />
          </Suspense>
        </div>
      </motion.div>
    </div>
  );
}
