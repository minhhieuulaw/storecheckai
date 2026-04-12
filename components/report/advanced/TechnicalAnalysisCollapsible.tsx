"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2, XCircle, AlertCircle, AlertTriangle, ShieldCheck, Truck } from "lucide-react";
import type { Report } from "@/lib/types";

const viewportOnce = { once: true };

export function TechnicalAnalysisCollapsible({ report }: { report: Report }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={viewportOnce}
      transition={{ duration: 0.4 }}
      className="mb-6">

      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-600 hover:text-gray-400 transition-all hover:bg-white/[0.015]"
        style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }}>
          <ChevronDown className="h-4 w-4" />
        </motion.div>
        {open ? "Hide" : "View"} full technical analysis
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden">
            <div className="mt-3 space-y-3">

              {/* All signals grid */}
              <div
                className="rounded-2xl p-5"
                style={{ background: "rgba(99,102,241,0.03)", border: "1px solid rgba(99,102,241,0.08)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/70 mb-4 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" /> All Trust Signals
                </p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {report.storeSignals.map((s, i) => {
                    const SIcon  = s.status === "pass" ? CheckCircle2 : s.status === "fail" ? XCircle : AlertCircle;
                    const sc     = s.status === "pass" ? "#4ade80" : s.status === "fail" ? "#f87171" : "#fbbf24";
                    return (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <SIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: sc }} />
                        <div className="min-w-0">
                          <span className="font-medium text-gray-300">{s.name}</span>
                          <span className="text-gray-600"> — {s.detail}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Red flags */}
              {report.redFlags.length > 0 && (
                <div
                  className="rounded-2xl p-5"
                  style={{ background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.09)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-400/80 mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Red Flags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {report.redFlags.map((f, i) => (
                      <span key={i}
                        className="rounded-full px-3 py-1 text-xs font-medium"
                        style={{ background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.16)", color: "#fca5a5" }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suspicious signals */}
              {(report.suspiciousSignals ?? []).length > 0 && (
                <div
                  className="rounded-2xl p-5"
                  style={{ background: "rgba(234,179,8,0.03)", border: "1px solid rgba(234,179,8,0.09)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/80 mb-3">Suspicious Patterns</p>
                  <ul className="space-y-1.5">
                    {report.suspiciousSignals.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-500/60" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Community scam reports */}
              {(report as unknown as { communityReports?: { count: number; snippets: string[] } }).communityReports && (report as unknown as { communityReports: { count: number; snippets: string[] } }).communityReports.count > 0 && (() => {
                const cr = (report as unknown as { communityReports: { count: number; snippets: string[] } }).communityReports;
                return (
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)" }}>
                        <span className="text-xs">🚨</span>
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-red-400/80">Community Reports</p>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
                        {cr.count} report{cr.count > 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-xs text-red-300/70 mb-3">Other users have flagged this store as potentially unsafe</p>
                    <div className="space-y-2">
                      {cr.snippets.map((s, i) => (
                        <div key={i} className="rounded-xl px-3 py-2 text-xs text-gray-400 leading-relaxed"
                          style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(239,68,68,0.1)" }}>
                          &ldquo;{s}{s.length >= 120 ? "..." : ""}&rdquo;
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Manipulation tactics */}
              {(report.manipulationTactics ?? []).length > 0 && (
                <div
                  className="rounded-2xl p-5"
                  style={{ background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.09)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-400/80 mb-1">Dark Patterns</p>
                  <p className="text-xs text-gray-600 mb-3">Tactics designed to pressure you into buying</p>
                  <div className="flex flex-wrap gap-2">
                    {report.manipulationTactics.map((t, i) => (
                      <span key={i}
                        className="rounded-full px-3 py-1 text-xs font-medium"
                        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.16)", color: "#fca5a5" }}>
                        ⚠ {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Review platforms */}
              {(report.reviewPlatforms ?? []).length > 0 && (
                <div
                  className="rounded-2xl p-5"
                  style={{ background: "rgba(34,197,94,0.03)", border: "1px solid rgba(34,197,94,0.08)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-green-400/80 mb-2">Customer Review Platforms</p>
                  <div className="flex flex-wrap gap-2">
                    {report.reviewPlatforms.map((p, i) => (
                      <span key={i}
                        className="rounded-lg px-3 py-1 text-xs font-medium"
                        style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.14)", color: "#86efac" }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipping origin */}
              {(report.shippingOriginSignals ?? []).length > 0 && (
                <div
                  className="rounded-2xl p-5"
                  style={{ background: "rgba(56,189,248,0.03)", border: "1px solid rgba(56,189,248,0.07)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-sky-400/80 mb-3 flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" /> Shipping Origin
                  </p>
                  <ul className="space-y-1">
                    {report.shippingOriginSignals.map((s, i) => (
                      <li key={i} className="text-xs text-gray-500">{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Complaints */}
              {report.complaints.length > 0 && (
                <div
                  className="rounded-2xl p-5"
                  style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">Likely Complaint Themes</p>
                  <ul className="space-y-1.5">
                    {report.complaints.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                        <span className="text-gray-700 shrink-0 mt-0.5">·</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
