"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, CheckCircle2, XCircle, ExternalLink,
  Image as ImageIcon, ChevronDown, ArrowLeft, Loader2, Shield,
} from "lucide-react";
import Link from "next/link";
import type { ScamReportRow } from "@/lib/scam-reports";

type FilterStatus = "all" | "pending" | "approved" | "rejected";

function StatusBadge({ status }: { status: string }) {
  const map = {
    pending:  { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.25)", label: "Pending" },
    approved: { color: "#4ade80", bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.25)", label: "Approved" },
    rejected: { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)", label: "Rejected" },
  } as Record<string, { color: string; bg: string; border: string; label: string }>;
  const s = map[status] ?? map.pending;
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {s.label}
    </span>
  );
}

function ReportCard({ report, onAction }: {
  report: ScamReportRow;
  onAction: (id: string, status: "approved" | "rejected", note?: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [acting, setActing] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const images = report.images as string[];

  async function act(status: "approved" | "rejected") {
    setActing(true);
    await onAction(report.id, status, note || undefined);
    setActing(false);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>

      {/* Header */}
      <button type="button" onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{report.domain}</p>
            <p className="text-xs text-gray-600 truncate">{report.shopUrl}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <StatusBadge status={report.status} />
          <span className="text-xs text-gray-600">{new Date(report.createdAt).toLocaleDateString()}</span>
          <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden">
            <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>

              {/* Shop URL */}
              <div className="pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Store URL</p>
                <a href={report.shopUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                  {report.shopUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Content */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{report.content}</p>
              </div>

              {/* Images */}
              {images.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Evidence ({images.length} image{images.length > 1 ? "s" : ""})
                  </p>
                  <div className="flex gap-2 mb-2">
                    {images.map((_, i) => (
                      <button key={i} type="button" onClick={() => setImgIdx(i)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-all"
                        style={{
                          background: imgIdx === i ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                          border: `1px solid ${imgIdx === i ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.1)"}`,
                          color: imgIdx === i ? "#a5b4fc" : "#6b7280",
                        }}>
                        <ImageIcon className="h-3 w-3" />#{i + 1}
                      </button>
                    ))}
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={images[imgIdx]} alt={`evidence ${imgIdx + 1}`}
                    className="max-w-full rounded-xl object-contain"
                    style={{ maxHeight: "320px", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
              )}

              {/* Admin actions — only for pending */}
              {report.status === "pending" && (
                <div className="pt-2 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Admin note (optional)
                    </label>
                    <input type="text" value={note} onChange={e => setNote(e.target.value)}
                      placeholder="Internal note for this decision…"
                      className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-indigo-500"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => act("approved")} disabled={acting}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
                      {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Approve → Add to blacklist
                    </button>
                    <button onClick={() => act("rejected")} disabled={acting}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                      {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Show admin note if already reviewed */}
              {report.status !== "pending" && report.adminNote && (
                <div className="rounded-xl px-4 py-3 text-sm text-gray-400"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <span className="font-semibold text-gray-500">Admin note: </span>{report.adminNote}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AdminScamReportsPage() {
  const [reports, setReports]     = useState<ScamReportRow[]>([]);
  const [filter, setFilter]       = useState<FilterStatus>("pending");
  const [loading, setLoading]     = useState(true);

  async function load(status: FilterStatus) {
    setLoading(true);
    try {
      const url = status === "all" ? "/api/admin/scam-reports" : `/api/admin/scam-reports?status=${status}`;
      const res  = await fetch(url);
      const data = await res.json() as { reports: ScamReportRow[] };
      setReports(data.reports ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(filter); }, [filter]);

  async function handleAction(id: string, status: "approved" | "rejected", note?: string) {
    await fetch(`/api/admin/scam-reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNote: note }),
    });
    load(filter);
  }

  const FILTERS: { key: FilterStatus; label: string }[] = [
    { key: "pending",  label: "Pending review" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all",      label: "All" },
  ];

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="h-4 w-4" />Back
        </Link>
        <span className="text-gray-700">·</span>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <Shield className="h-4 w-4 text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-white">Scam Reports</h1>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="rounded-xl px-4 py-2 text-sm font-medium transition-all"
            style={filter === f.key
              ? { background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "#a5b4fc" }
              : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280" }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl p-10 text-center"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <AlertTriangle className="h-8 w-8 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-600">No reports found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <ReportCard key={r.id} report={r} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  );
}
