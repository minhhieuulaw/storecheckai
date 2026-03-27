"use client";

import { useState, useEffect } from "react";
import { User, Lock, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, CreditCard, ExternalLink, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UserInfo { email: string; name: string; plan: string; checksRemaining: number; createdAt: string; }

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:     { label: "Free trial",  color: "#9ca3af" },
  starter:  { label: "Starter",     color: "#60a5fa" },
  personal: { label: "Personal",    color: "#a78bfa" },
  pro:      { label: "Pro",         color: "#f59e0b" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <h2 className="text-sm font-semibold text-white mb-5">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function inputStyle() {
  return "w-full rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none transition-all disabled:opacity-50";
}

function Toast({ ok, msg }: { ok: boolean; msg: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
      style={ok
        ? { background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80" }
        : { background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171" }}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
      {msg}
    </motion.div>
  );
}

function BillingPortalButton() {
  const [loading, setLoading] = useState(false);
  async function openPortal() {
    setLoading(true);
    const res  = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json() as { url?: string };
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  }
  return (
    <button onClick={openPortal} disabled={loading}
      className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-50"
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CreditCard className="h-3.5 w-3.5" /><ExternalLink className="h-3 w-3" /></>}
      Manage billing
    </button>
  );
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserInfo | null>(null);

  // Profile form
  const [name, setName] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => { if (d.user) { setUser(d.user); setName(d.user.name); } });
  }, []);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim() === user?.name) return;
    setNameSaving(true); setNameMsg(null);
    const res = await fetch("/api/user/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const data = await res.json();
    setNameSaving(false);
    if (data.success) {
      setNameMsg({ ok: true, text: "Name updated successfully." });
      setUser(u => u ? { ...u, name: data.name } : u);
    } else {
      setNameMsg({ ok: false, text: data.error || "Failed to update name." });
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPw || !newPw) return;
    setPwSaving(true); setPwMsg(null);
    const res = await fetch("/api/user/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }) });
    const data = await res.json();
    setPwSaving(false);
    if (data.success) {
      setPwMsg({ ok: true, text: "Password updated successfully." });
      setCurrentPw(""); setNewPw("");
    } else {
      setPwMsg({ ok: false, text: data.error || "Failed to update password." });
    }
  }

  const baseInput = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" };

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account details.</p>
      </div>

      <div className="space-y-5">

        {/* Billing */}
        <Section title="Billing & Plan">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <Zap className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {PLAN_LABELS[user?.plan ?? "free"]?.label ?? "Free"} Plan
                </p>
                <p className="text-xs text-gray-500">
                  {user?.checksRemaining ?? 0} check{user?.checksRemaining !== 1 ? "s" : ""} remaining
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href="/#pricing"
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                Upgrade
              </a>
              {user?.plan !== "free" && user?.plan !== "starter" && (
                <BillingPortalButton />
              )}
            </div>
          </div>
        </Section>

        {/* Profile */}
        <Section title="Profile">
          <form onSubmit={saveName} className="space-y-4">
            <Field label="Email">
              <input
                value={user?.email ?? ""}
                disabled
                className={inputStyle()}
                style={{ ...baseInput, opacity: 0.5, cursor: "not-allowed" }}
              />
            </Field>
            <Field label="Display name">
              <div className="flex gap-2">
                <input
                  value={name}
                  onChange={e => { setName(e.target.value); setNameMsg(null); }}
                  disabled={nameSaving}
                  className={`${inputStyle()} flex-1`}
                  style={baseInput}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button
                  type="submit"
                  disabled={nameSaving || !name.trim() || name.trim() === user?.name}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                  {nameSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><User className="h-3.5 w-3.5" /> Save</>}
                </button>
              </div>
            </Field>
            <AnimatePresence>
              {nameMsg && <Toast ok={nameMsg.ok} msg={nameMsg.text} />}
            </AnimatePresence>
            {user?.createdAt && (
              <p className="text-xs text-gray-600">
                Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            )}
          </form>
        </Section>

        {/* Password */}
        <Section title="Change Password">
          <form onSubmit={savePassword} className="space-y-4">
            <Field label="Current password">
              <div className="relative">
                <input
                  type={showCur ? "text" : "password"}
                  value={currentPw}
                  onChange={e => { setCurrentPw(e.target.value); setPwMsg(null); }}
                  disabled={pwSaving}
                  placeholder="Enter current password"
                  className={`${inputStyle()} pr-10`}
                  style={baseInput}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowCur(!showCur)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-600 hover:text-gray-400 transition-colors">
                  {showCur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Field label="New password">
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={e => { setNewPw(e.target.value); setPwMsg(null); }}
                  disabled={pwSaving}
                  placeholder="Min. 6 characters"
                  className={`${inputStyle()} pr-10`}
                  style={baseInput}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-600 hover:text-gray-400 transition-colors">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <AnimatePresence>
              {pwMsg && <Toast ok={pwMsg.ok} msg={pwMsg.text} />}
            </AnimatePresence>
            <button
              type="submit"
              disabled={pwSaving || !currentPw || !newPw}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              {pwSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : <><Lock className="h-3.5 w-3.5" /> Update password</>}
            </button>
          </form>
        </Section>

      </div>
    </div>
  );
}
