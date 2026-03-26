"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield, ArrowLeft, Lock, Loader2, CreditCard, Calendar,
  CheckCircle2, AlertTriangle, RefreshCw, XCircle, Crown,
} from "lucide-react";
import Link from "next/link";

interface SubscriptionData {
  id: string;
  status: string;
  plan: string;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  } | null;
}

const PLAN_LABELS: Record<string, string> = {
  personal: "Personal",
  pro: "Pro",
  starter: "Starter",
};

const PLAN_COLORS: Record<string, string> = {
  personal: "#a78bfa",
  pro: "#f59e0b",
  starter: "#60a5fa",
};

export default function ManageSubscriptionPage() {
  const router = useRouter();
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<"cancel" | "reactivate" | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    fetch("/api/stripe/subscription")
      .then(r => r.json())
      .then((data: { subscription?: SubscriptionData; error?: string }) => {
        if (data.error) { setError(data.error); return; }
        setSub(data.subscription ?? null);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel() {
    if (!confirm("Cancel your subscription? You'll keep access until the end of the billing period.")) return;
    setActionLoading("cancel");
    try {
      const res = await fetch("/api/stripe/subscription", { method: "DELETE" });
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.error) { showToast(data.error, false); return; }
      setSub(prev => prev ? { ...prev, cancelAtPeriodEnd: true } : prev);
      showToast("Subscription will cancel at end of period.", true);
    } catch (e) {
      showToast(String(e), false);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReactivate() {
    setActionLoading("reactivate");
    try {
      const res = await fetch("/api/stripe/subscription", { method: "PATCH" });
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.error) { showToast(data.error, false); return; }
      setSub(prev => prev ? { ...prev, cancelAtPeriodEnd: false } : prev);
      showToast("Subscription reactivated!", true);
    } catch (e) {
      showToast(String(e), false);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUpdatePayment() {
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedded: false }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else showToast(data.error ?? "Failed to open portal.", false);
    } catch (e) {
      showToast(String(e), false);
    }
  }

  const planLabel = sub ? (PLAN_LABELS[sub.plan] ?? sub.plan) : "";
  const planColor = sub ? (PLAN_COLORS[sub.plan] ?? "#9ca3af") : "#9ca3af";
  const periodEnd = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;
  const isActive = sub?.status === "active";

  return (
    <div className="min-h-screen" style={{ background: "#07070f" }}>
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)" }} />
      </div>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium shadow-lg"
          style={{
            background: toast.ok ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
            border: `1px solid ${toast.ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            color: toast.ok ? "#86efac" : "#fca5a5",
          }}>
          {toast.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </motion.div>
      )}

      {/* Navbar */}
      <nav className="border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(7,7,15,0.8)", backdropFilter: "blur(12px)" }}>
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
            <Shield className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white">StorecheckAI</span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Lock className="h-3 w-3" />
          Secured by Stripe
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <button
          onClick={() => router.push("/dashboard/billing")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to billing
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Manage Subscription</h1>
          <p className="text-gray-500 text-sm">View and manage your current plan.</p>
        </div>

        {/* States */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
            <p className="text-sm text-gray-500">Loading subscription…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => router.push("/dashboard/billing")}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              Go back
            </button>
          </div>
        )}

        {!loading && !error && !sub && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-gray-400 text-sm">No active subscription found.</p>
            <button
              onClick={() => router.push("/dashboard/billing")}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              View plans
            </button>
          </div>
        )}

        {!loading && !error && sub && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="space-y-4">

            {/* Plan card */}
            <div className="rounded-3xl p-6"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl shrink-0"
                  style={{ background: `${planColor}18`, border: `1px solid ${planColor}30` }}>
                  <Crown className="h-5 w-5" style={{ color: planColor }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">{planLabel} Plan</h2>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        background: isActive ? `${planColor}18` : "rgba(239,68,68,0.12)",
                        color: isActive ? planColor : "#f87171",
                      }}>
                      {sub.cancelAtPeriodEnd ? "Cancelling" : sub.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Subscription ID: {sub.id}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Billing period */}
                {periodEnd && (
                  <div className="flex items-start gap-3 rounded-2xl p-4"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <Calendar className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] text-gray-600 mb-0.5">
                        {sub.cancelAtPeriodEnd ? "Access until" : "Next renewal"}
                      </p>
                      <p className="text-sm font-semibold text-white">{periodEnd}</p>
                    </div>
                  </div>
                )}

                {/* Payment method */}
                <div className="flex items-start gap-3 rounded-2xl p-4"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <CreditCard className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] text-gray-600 mb-0.5">Payment method</p>
                    {sub.card ? (
                      <p className="text-sm font-semibold text-white capitalize">
                        {sub.card.brand} ···· {sub.card.last4}
                        <span className="text-xs text-gray-500 ml-1 font-normal">
                          {sub.card.expMonth}/{sub.card.expYear}
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">No card on file</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cancel warning banner */}
              {sub.cancelAtPeriodEnd && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl px-4 py-3"
                  style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-300">
                    Your subscription is set to cancel on <strong>{periodEnd}</strong>.
                    Reactivate below to keep your plan.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="rounded-3xl p-6 space-y-3"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Actions</h3>

              {/* Update payment method */}
              <button
                onClick={handleUpdatePayment}
                className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <CreditCard className="h-4 w-4 text-gray-500" />
                Update payment method
              </button>

              {/* Reactivate or Cancel */}
              {sub.cancelAtPeriodEnd ? (
                <button
                  onClick={handleReactivate}
                  disabled={actionLoading === "reactivate"}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff" }}>
                  {actionLoading === "reactivate"
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Reactivating…</>
                    : <><RefreshCw className="h-4 w-4" />Reactivate subscription</>}
                </button>
              ) : (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading === "cancel"}
                  className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-colors disabled:opacity-60"
                  style={{
                    background: "rgba(239,68,68,0.05)",
                    border: "1px solid rgba(239,68,68,0.15)",
                    color: "#f87171",
                  }}>
                  {actionLoading === "cancel"
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Cancelling…</>
                    : <><XCircle className="h-4 w-4" />Cancel subscription</>}
                </button>
              )}
            </div>

            <p className="text-center text-[10px] text-gray-700 pt-1">
              Changes take effect immediately · Data retained 30 days after cancellation
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
