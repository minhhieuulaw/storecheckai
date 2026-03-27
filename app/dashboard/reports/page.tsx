"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Search, CheckCircle2, AlertTriangle, XCircle, Clock, ArrowRight } from "lucide-react";
import type { Verdict } from "@/lib/types";

interface ReportSummary {
  id: string;
  url: string;
  domain: string;
  storeName: string;
  analyzedAt: string;
  trustScore: number;
  verdict: Verdict;
  returnRisk: string;
  ogImage: string | null;
}

function verdictIcon(v: Verdict) {
  if (v === "BUY") return <CheckCircle2 className="h-4 w-4 text-green-400" />;
  if (v === "CAUTION") return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
  return <XCircle className="h-4 w-4 text-red-400" />;
}
function verdictBadge(v: Verdict) {
  if (v === "BUY") return "rgba(74,222,128,0.12)";
  if (v === "CAUTION") return "rgba(250,204,21,0.12)";
  return "rgba(248,113,113,0.12)";
}
function verdictText(v: Verdict) {
  if (v === "BUY") return "#4ade80";
  if (v === "CAUTION") return "#facc15";
  return "#f87171";
}
function scoreColor(s: number) {
  if (s >= 70) return "#4ade80";
  if (s >= 45) return "#facc15";
  return "#f87171";
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | Verdict>("ALL");

  useEffect(() => {
    fetch("/api/user/reports")
      .then(r => r.json())
      .then(d => { setReports(d.reports ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = reports.filter(r => {
    const matchQ = !query || r.storeName.toLowerCase().includes(query.toLowerCase()) || r.domain.toLowerCase().includes(query.toLowerCase());
    const matchF = filter === "ALL" || r.verdict === filter;
    return matchQ && matchF;
  });

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">My Reports</h1>
        <p className="text-sm text-gray-500 mt-1">All store checks linked to your account.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by store name or domain…"
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5 shrink-0">
          {(["ALL", "BUY", "CAUTION", "SKIP"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap"
              style={{
                background: filter === f ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                border: filter === f ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.08)",
                color: filter === f ? "#a5b4fc" : "#6b7280",
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <FileText className="h-8 w-8 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-600">{reports.length === 0 ? "No reports yet." : "No reports match your filter."}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <Link key={r.id} href={`/report/${r.id}`}>
              <div className="flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-white/[0.03] cursor-pointer group"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                {r.ogImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.ogImage} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" style={{ border: "1px solid rgba(255,255,255,0.08)" }} />
                ) : (
                  <div className="h-10 w-10 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold text-gray-600"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {r.domain.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{r.storeName}</p>
                  <p className="text-xs text-gray-600 truncate">{r.domain}</p>
                </div>

                {/* Trust score */}
                <div className="text-center shrink-0">
                  <p className="text-lg font-bold" style={{ color: scoreColor(r.trustScore) }}>{r.trustScore}</p>
                  <p className="text-[10px] text-gray-600">Score</p>
                </div>

                {/* Verdict badge */}
                <div className="flex items-center gap-1.5 rounded-full px-3 py-1 shrink-0"
                  style={{ background: verdictBadge(r.verdict), border: `1px solid ${verdictText(r.verdict)}30` }}>
                  {verdictIcon(r.verdict)}
                  <span className="text-xs font-semibold" style={{ color: verdictText(r.verdict) }}>{r.verdict}</span>
                </div>

                {/* Date — hidden on mobile */}
                <div className="hidden sm:flex items-center gap-1 text-xs text-gray-600 shrink-0">
                  <Clock className="h-3 w-3" />
                  {new Date(r.analyzedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>

                <ArrowRight className="h-4 w-4 text-gray-700 group-hover:text-gray-500 transition-colors shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-gray-700 text-center">{filtered.length} report{filtered.length !== 1 ? "s" : ""}</p>
    </div>
  );
}
