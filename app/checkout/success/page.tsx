"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Loader2, Zap } from "lucide-react";

const PLAN_INFO: Record<string, { label: string; checks: string; color: string }> = {
  starter:  { label: "Starter",  checks: "1 check added",           color: "#60a5fa" },
  personal: { label: "Personal", checks: "10 checks / month",       color: "#a78bfa" },
  pro:      { label: "Pro",      checks: "50 checks / month",       color: "#f59e0b" },
};

function SuccessContent() {
  const params  = useSearchParams();
  const router  = useRouter();
  const [plan, setPlan]       = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = params.get("session_id");
    if (!sessionId) { router.replace("/dashboard"); return; }

    // Fetch session info to get the plan
    fetch(`/api/stripe/checkout?session_id=${sessionId}`)
      .then(r => r.json())
      .then(d => { setPlan(d.plan ?? "personal"); setLoading(false); })
      .catch(() => { setPlan("personal"); setLoading(false); });
  }, [params, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        <p className="text-sm text-gray-500">Confirming payment…</p>
      </div>
    );
  }

  const info = PLAN_INFO[plan ?? "personal"] ?? PLAN_INFO.personal;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="w-full max-w-md text-center">

      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, type: "spring", bounce: 0.5 }}
        className="flex h-20 w-20 mx-auto items-center justify-center rounded-3xl mb-6"
        style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)" }}>
        <CheckCircle2 className="h-10 w-10 text-green-400" />
      </motion.div>

      <h1 className="text-3xl font-bold text-white mb-2">Payment successful!</h1>
      <p className="text-gray-400 mb-8">Your account has been upgraded.</p>

      {/* Plan badge */}
      <div className="inline-flex items-center gap-2.5 rounded-2xl px-5 py-3 mb-8"
        style={{ background: `${info.color}12`, border: `1px solid ${info.color}30` }}>
        <Zap className="h-4 w-4" style={{ color: info.color }} />
        <div className="text-left">
          <p className="text-sm font-bold text-white">{info.label} Plan</p>
          <p className="text-xs" style={{ color: info.color }}>{info.checks}</p>
        </div>
      </div>

      <motion.button
        onClick={() => router.push("/dashboard")}
        whileHover={{ opacity: 0.9 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 mx-auto rounded-2xl px-8 py-3.5 text-sm font-semibold text-white"
        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
        Go to dashboard
        <ArrowRight className="h-4 w-4" />
      </motion.button>
    </motion.div>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#07070f" }}>
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%)" }} />
      </div>
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-violet-400" />}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
