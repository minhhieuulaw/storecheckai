"use client";

import { useState } from "react";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";

export function VerifyEmailBanner({ verifySuccess }: { verifySuccess?: boolean }) {
  const [resending, setResending] = useState(false);
  const [resent,    setResent]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  if (verifySuccess) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-2xl px-5 py-4"
        style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.22)" }}>
        <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
        <p className="text-sm text-green-300 font-medium">
          Email verified! Your free check has been credited.
        </p>
      </div>
    );
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    try {
      const res  = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.success) { setResent(true); }
      else { setError(data.error ?? "Failed to resend."); }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl px-5 py-4 flex-wrap"
      style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.25)" }}>
      <div className="flex items-center gap-2.5">
        <Mail className="h-4 w-4 text-violet-400 shrink-0" />
        <div>
          <p className="text-sm text-violet-200 font-medium">Verify your email to claim your free check</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {resent
              ? "Verification email sent! Check your inbox."
              : error ?? "We sent a link to your email when you signed up."}
          </p>
        </div>
      </div>
      {!resent && (
        <button
          onClick={handleResend}
          disabled={resending}
          className="shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
          {resending ? <><Loader2 className="h-3 w-3 animate-spin" />Sending…</> : "Resend email"}
        </button>
      )}
    </div>
  );
}
