"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Props { open: boolean; onClose: () => void; }

export function LoginPromptModal({ open, onClose }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [done,     setDone]     = useState(false);

  function reset() { setName(""); setEmail(""); setPassword(""); setError(null); setDone(false); setLoading(false); }
  function handleClose() { reset(); onClose(); }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) return;
    setError(null); setLoading(true);
    try {
      const res  = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!data.success) { setError(data.error ?? "Registration failed."); return; }
      setDone(true);
      setTimeout(() => { handleClose(); router.push("/dashboard"); router.refresh(); }, 1500);
    } catch {
      setError(t.auth.login.networkError);
    } finally { setLoading(false); }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} onClick={handleClose}
            className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }} />

          <motion.div key="modal" initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">

            <div className="relative w-full max-w-md rounded-3xl p-8 pointer-events-auto"
              style={{ background: "rgba(9,9,18,0.97)", border: "1px solid rgba(139,92,246,0.22)", boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.7), 0 0 100px rgba(99,102,241,0.07)" }}>

              <button onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-600 hover:text-gray-400 transition-colors"
                style={{ background: "rgba(255,255,255,0.04)" }}>
                <X className="h-4 w-4" />
              </button>

              <AnimatePresence mode="wait">
                {done ? (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
                      style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)" }}>
                      <CheckCircle2 className="h-7 w-7 text-green-400" />
                    </div>
                    <p className="text-lg font-bold text-white">{t.modal.successTitle}</p>
                    <p className="text-sm text-gray-500 mt-1">{t.modal.successSub}</p>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white leading-tight">{t.modal.heading}</h2>
                        <p className="text-xs text-gray-600">{t.modal.subheading}</p>
                      </div>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1 uppercase tracking-wider">{t.auth.register.nameLabel}</label>
                        <input type="text" value={name} onChange={e => { setName(e.target.value); setError(null); }}
                          placeholder="John Doe" autoComplete="name" required disabled={loading}
                          className="w-full rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-700 outline-none transition-all disabled:opacity-50"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                          onFocus={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                          onBlur={e =>  { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; }} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1 uppercase tracking-wider">{t.auth.register.emailLabel}</label>
                        <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(null); }}
                          placeholder="you@example.com" autoComplete="email" required disabled={loading}
                          className="w-full rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-700 outline-none transition-all disabled:opacity-50"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                          onFocus={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                          onBlur={e =>  { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; }} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1 uppercase tracking-wider">{t.auth.register.passwordLabel}</label>
                        <div className="relative">
                          <input type={showPw ? "text" : "password"} value={password}
                            onChange={e => { setPassword(e.target.value); setError(null); }}
                            placeholder="Min. 6 characters" autoComplete="new-password" required disabled={loading}
                            className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-200 placeholder-gray-700 outline-none transition-all disabled:opacity-50"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                            onFocus={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                            onBlur={e =>  { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; }} />
                          <button type="button" onClick={() => setShowPw(!showPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors">
                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {error && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
                            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#f87171" }}>
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {error}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.button type="submit" disabled={loading || !name || !email || !password}
                        whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.97 }}
                        className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-1"
                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                        {loading
                          ? <><Loader2 className="h-4 w-4 animate-spin" />{t.auth.register.submitting}</>
                          : t.auth.register.submit}
                      </motion.button>
                    </form>

                    <p className="text-center text-xs text-gray-700 mt-4">
                      {t.auth.register.hasAccount}{" "}
                      <a href="/login" className="text-violet-500 hover:text-violet-400 transition-colors">{t.auth.register.signIn}</a>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
