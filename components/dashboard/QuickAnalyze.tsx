"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Lock } from "lucide-react";
import { AnalyzingModal } from "@/components/AnalyzingModal";
import { UpgradeModal } from "@/components/dashboard/UpgradeModal";

interface Props {
  checksRemaining: number;
}

export function QuickAnalyze({ checksRemaining }: Props) {
  const [url,           setUrl]           = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [showUpgrade,   setShowUpgrade]   = useState(false);
  const router = useRouter();

  const locked = checksRemaining === 0;

  async function handleAnalyze() {
    if (locked) { setShowUpgrade(true); return; }
    const trimmed = url.trim();
    if (!trimmed) { setError("Please paste a store or product URL."); return; }
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/analyze", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ url: trimmed }),
      });
      const data = await res.json() as { success: boolean; reportId?: string; error?: string; code?: string };

      if (data.code === "QUOTA_EXCEEDED" || res.status === 402) {
        setLoading(false);
        setShowUpgrade(true);
        return;
      }
      if (!data.success) { setLoading(false); setError(data.error || "Analysis failed."); return; }
      router.push(`/report/${data.reportId}`);
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <>
      <AnalyzingModal url={url} open={loading} />
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} reason="quota" />

      <div className="rounded-2xl p-5"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Quick Analyze</p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={url}
            onChange={e => { setUrl(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && !loading && handleAnalyze()}
            placeholder={locked ? "Upgrade to analyze stores…" : "Paste any store or product URL…"}
            disabled={loading}
            className="flex-1 min-w-0 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none transition-all disabled:opacity-50"
            style={{
              background: locked ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              cursor: locked ? "default" : "text",
            }}
            onFocus={e => { if (!locked) { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}}
            onBlur={e  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; }}
            readOnly={locked}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || (!locked && !url.trim())}
            className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            style={{ background: locked ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : locked
              ? <><Lock className="h-3.5 w-3.5" /><span>Upgrade</span></>
              : <><span>Analyze</span><ArrowRight className="h-3.5 w-3.5" /></>}
          </button>
        </div>

        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>
    </>
  );
}
