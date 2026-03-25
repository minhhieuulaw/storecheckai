"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") ?? "/dashboard";
  const { t } = useTranslation();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    const display = document.cookie.split(";").find(c => c.trim().startsWith("user_display="));
    if (display) router.replace(from);
  }, [from, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!data.success) { setError(data.error ?? t.auth.login.loginFailed); return; }
      router.push(from);
      router.refresh();
    } catch {
      setError(t.auth.login.networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
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
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl mb-4"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 32px rgba(99,102,241,0.3)" }}>
          <Shield className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">StorecheckAI</h1>
        <p className="text-sm text-gray-500 mt-1">{t.auth.login.subtitle}</p>
      </div>

      {/* Card */}
      <div
        className="rounded-3xl p-8"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(16px)",
        }}>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">{t.auth.login.emailLabel}</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(null); }}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={loading}
              className="w-full rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-700 outline-none transition-all disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
              onFocus={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
              onBlur={e =>  { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">{t.auth.login.passwordLabel}</label>
              <a href="/forgot-password" className="text-xs text-violet-500 hover:text-violet-400 transition-colors">
                {t.auth.login.forgotPassword}
              </a>
            </div>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null); }}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={loading}
                className="w-full rounded-xl px-4 py-3 pr-11 text-sm text-gray-200 placeholder-gray-700 outline-none transition-all disabled:opacity-50"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                onFocus={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                onBlur={e =>  { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors p-1">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
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
            disabled={loading || !email || !password}
            whileHover={{ opacity: 0.9 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />{t.auth.login.submitting}</> : t.auth.login.submit}
          </motion.button>

        </form>
      </div>

      <p className="text-center text-xs text-gray-600 mt-6">
        {t.auth.login.noAccount}{" "}
        <a href="/register" className="text-violet-500 hover:text-violet-400 transition-colors">{t.auth.login.createAccount}</a>
      </p>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#07070f" }}>
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)" }}
        />
      </div>
      <Suspense fallback={
        <div className="w-full max-w-md flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl animate-pulse" style={{ background: "rgba(99,102,241,0.3)" }} />
          <div className="h-8 w-48 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
