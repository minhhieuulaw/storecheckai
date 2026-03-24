"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ExternalLink, ChevronDown,
  AlertTriangle, CheckCircle2, Loader2, AlertCircle, Shield,
} from "lucide-react";
import type { FBCheckResult } from "@/app/api/facebook-check/route";

const HOW_TO_STEPS = [
  {
    step: "1",
    title: "From the ad post",
    lines: [
      'Click "..." (3 dots) in the top-right corner of the ad',
      '"Copy link to post" or "Share" → "Copy link"',
      "Paste the link into the field below",
    ],
  },
  {
    step: "2",
    title: "From the Page name",
    lines: [
      "Click the Page name in the ad",
      "Copy the URL from the address bar (facebook.com/pagename)",
      "Paste it into the field below",
    ],
  },
];

function riskConfig(level: FBCheckResult["riskLevel"]) {
  if (level === "HIGH")   return { label: "High Risk",       color: "#f87171", bg: "rgba(239,68,68,0.07)",    border: "rgba(239,68,68,0.18)"   };
  if (level === "MEDIUM") return { label: "Medium Risk",     color: "#fbbf24", bg: "rgba(234,179,8,0.07)",    border: "rgba(234,179,8,0.18)"   };
  if (level === "LOW")    return { label: "Low Risk",        color: "#4ade80", bg: "rgba(34,197,94,0.07)",    border: "rgba(34,197,94,0.18)"   };
  return                         { label: "Not Enough Data", color: "#6b7280", bg: "rgba(107,114,128,0.07)",  border: "rgba(107,114,128,0.18)" };
}

export default function FBAdChecker() {
  const [showHowTo, setShowHowTo] = useState(false);
  const [fbUrl,     setFbUrl]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [result,    setResult]    = useState<FBCheckResult | null>(null);

  const [showForm,  setShowForm]  = useState(false);
  const [ageMonths, setAgeMonths] = useState("");
  const [country,   setCountry]   = useState("");
  const [updating,  setUpdating]  = useState(false);

  async function analyze(extraAge?: number, extraCountry?: string) {
    if (!fbUrl.trim()) return;
    extraAge !== undefined ? setUpdating(true) : setLoading(true);
    setError(null);

    try {
      const res  = await fetch("/api/facebook-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fbUrl: fbUrl.trim(),
          ...(extraAge    != null  ? { pageAgeMonths: extraAge }       : {}),
          ...(extraCountry         ? { managerCountry: extraCountry }  : {}),
        }),
      });
      const data = await res.json() as FBCheckResult & { error?: string };
      if (data.error) { setError(data.error); setResult(null); }
      else { setResult(data); }
    } catch {
      setError("Request failed. Please try again.");
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  }

  function handleUpdateTransparency() {
    const months = ageMonths ? parseInt(ageMonths) : undefined;
    analyze(months, country || undefined);
  }

  const rc = result ? riskConfig(result.riskLevel) : null;

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{ border: "1px solid rgba(139,92,246,0.18)", background: "rgba(139,92,246,0.035)" }}>

      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-5"
        style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
          style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.28)" }}>
          <Search className="h-4 w-4" style={{ color: "#a78bfa" }} />
        </div>
        <div>
          <p className="text-sm font-bold text-violet-300">Facebook Ad Deep Check</p>
          <p className="text-xs text-gray-600">Paste ad link → analyze the page behind it</p>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">

        {/* How-to guide */}
        <div>
          <button
            onClick={() => setShowHowTo(!showHowTo)}
            className="flex items-center gap-1.5 text-xs font-semibold text-violet-400/80 hover:text-violet-300 transition-colors">
            <motion.div animate={{ rotate: showHowTo ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-3.5 w-3.5" />
            </motion.div>
            How to get the ad link
          </button>

          <AnimatePresence initial={false}>
            {showHowTo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.04, 0.62, 0.23, 0.98] }}
                className="overflow-hidden">
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {HOW_TO_STEPS.map(s => (
                    <div key={s.step} className="rounded-xl p-4"
                      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-xs font-bold text-violet-300 mb-2.5 flex items-center gap-2">
                        <span
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px]"
                          style={{ background: "rgba(139,92,246,0.3)" }}>
                          {s.step}
                        </span>
                        {s.title}
                      </p>
                      <ul className="space-y-1.5">
                        {s.lines.map((l, i) => (
                          <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                            <span className="text-violet-600 shrink-0 mt-0.5">›</span>
                            {l}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="url"
            value={fbUrl}
            onChange={e => setFbUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !loading && analyze()}
            placeholder="https://www.facebook.com/pagename  or  post link"
            className="flex-1 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-700 outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
          />
          <motion.button
            onClick={() => analyze()}
            disabled={loading || !fbUrl.trim()}
            whileHover={{ opacity: 0.9 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed shrink-0 transition-opacity"
            style={{ background: "linear-gradient(135deg,#7c3aed,#6366f1)" }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? "Checking…" : "Analyze"}
          </motion.button>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
              style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", color: "#f87171" }}>
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && rc && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3">

              {/* Page info card */}
              <div
                className="rounded-2xl px-5 py-4"
                style={{ background: rc.bg, border: `1px solid ${rc.border}` }}>

                {/* Header row: avatar + name + badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {result.coverImageUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={result.coverImageUrl}
                        alt={result.pageName || result.handle}
                        className="h-11 w-11 rounded-xl shrink-0 object-cover"
                        style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-100 leading-tight">{result.pageName || result.handle}</p>
                      <p className="text-xs text-gray-600 mt-0.5">facebook.com/{result.handle}</p>
                    </div>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-3 py-1 text-xs font-bold"
                    style={{ background: `${rc.color}20`, color: rc.color }}>
                    {rc.label}
                  </span>
                </div>

                {/* Stats row */}
                {(result.likeCount != null || result.talkingAbout != null) && (
                  <div className="flex flex-wrap gap-3 mt-3">
                    {result.likeCount != null && (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">Likes</span>
                        <span className="text-sm font-bold" style={{ color: rc.color }}>
                          {result.likeCount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {result.talkingAbout != null && (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">Talking about</span>
                        <span className="text-sm font-bold text-gray-300">
                          {result.talkingAbout.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {result.likeCount != null && result.talkingAbout != null && result.likeCount > 0 && (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">Engagement</span>
                        <span className="text-sm font-bold text-gray-300">
                          {((result.talkingAbout / result.likeCount) * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                {result.description && (
                  <p className="text-xs text-gray-500 mt-3 leading-relaxed border-t pt-3 line-clamp-3"
                    style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    {result.description}
                  </p>
                )}
              </div>

              {/* Quick links */}
              <div className="flex flex-wrap gap-2">
                <a href={result.adLibraryUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:opacity-80"
                  style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.22)", color: "#a5b4fc" }}>
                  📚 View Ad Library <ExternalLink className="h-3 w-3" />
                </a>
                <a href={result.pageUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:opacity-80"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}>
                  Open Page + Check Transparency <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Risk + positive signals */}
              {(result.riskSignals.length > 0 || result.positiveSignals.length > 0) && (
                <div className="space-y-1.5">
                  {result.riskSignals.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm" style={{ color: "#fca5a5" }}>
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-400" />
                      {s}
                    </div>
                  ))}
                  {result.positiveSignals.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm" style={{ color: "#86efac" }}>
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-400" />
                      {s}
                    </div>
                  ))}
                </div>
              )}

              {/* AI summary */}
              <div
                className="rounded-2xl px-5 py-4"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-bold tracking-widest text-violet-400/80 mb-2 uppercase">AI Assessment</p>
                <p className="text-sm text-gray-300 leading-relaxed">{result.aiSummary}</p>
              </div>

              {/* Page Transparency form */}
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  style={{ background: "rgba(255,255,255,0.02)" }}>
                  <span className="font-medium text-xs">+ Add Page Transparency details for deeper analysis</span>
                  <motion.div animate={{ rotate: showForm ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="h-4 w-4" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {showForm && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="overflow-hidden">
                      <div
                        className="px-5 pb-5 pt-4 space-y-4"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <p className="text-xs text-gray-600">
                          Open the Page → click <strong className="text-gray-400">&quot;...&quot;</strong> → <strong className="text-gray-400">&quot;Page Transparency&quot;</strong> → enter the details below
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1.5">Page created (months ago)</label>
                            <input
                              type="number" min="0" value={ageMonths}
                              onChange={e => setAgeMonths(e.target.value)}
                              placeholder="e.g. 8"
                              className="w-full rounded-xl px-3 py-2 text-sm text-gray-200 outline-none transition-all"
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1.5">Managers located in</label>
                            <input
                              type="text" value={country}
                              onChange={e => setCountry(e.target.value)}
                              placeholder="e.g. Netherlands"
                              className="w-full rounded-xl px-3 py-2 text-sm text-gray-200 outline-none transition-all"
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                            />
                          </div>
                        </div>
                        <motion.button
                          onClick={handleUpdateTransparency}
                          disabled={updating}
                          whileHover={{ opacity: 0.9 }}
                          whileTap={{ scale: 0.97 }}
                          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 transition-all"
                          style={{ background: "linear-gradient(135deg,#7c3aed,#6366f1)" }}>
                          {updating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          {updating ? "Updating…" : "Update Analysis"}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
