"use client";

import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw, ExternalLink } from "lucide-react";

interface FailureRow {
  id: string;
  userId: string | null;
  url: string;
  domain: string;
  errorType: string;
  errorMsg: string;
  userAgent: string | null;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  timeout: "text-amber-400 bg-amber-400/10",
  scrape_error: "text-blue-400 bg-blue-400/10",
  ai_error: "text-purple-400 bg-purple-400/10",
  unknown: "text-red-400 bg-red-400/10",
};

export default function AnalysisFailuresPage() {
  const [rows, setRows] = useState<FailureRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const fetchData = async (p = 0) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analysis-failures?limit=30&offset=${p * 30}`);
      const data = await res.json();
      setRows(data.rows || []);
      setTotal(data.total || 0);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(page); }, [page]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" /> Analysis Failure Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">{total} total failures recorded</p>
        </div>
        <button onClick={() => fetchData(page)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Time</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Domain</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Error</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-600">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-600">No failures recorded yet</td></tr>
            ) : rows.map(row => (
              <tr key={row.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {new Date(row.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <a href={row.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                    {row.domain} <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${TYPE_COLORS[row.errorType] || TYPE_COLORS.unknown}`}>
                    {row.errorType}
                  </span>
                </td>
                <td className="px-4 py-3 max-w-[300px]">
                  <p className="text-xs text-gray-400 truncate" title={row.errorMsg}>
                    {row.errorMsg.split("\n")[0]}
                  </p>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {row.userId ? row.userId.slice(0, 8) + "..." : "anon"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 30 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="text-xs text-gray-500 hover:text-white disabled:opacity-30 transition-colors">
            Previous
          </button>
          <span className="text-xs text-gray-600">Page {page + 1} of {Math.ceil(total / 30)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * 30 >= total}
            className="text-xs text-gray-500 hover:text-white disabled:opacity-30 transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
