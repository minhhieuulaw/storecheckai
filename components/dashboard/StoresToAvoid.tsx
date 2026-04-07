"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldAlert, XCircle, ArrowRight, AlertTriangle } from "lucide-react";
import type { Report } from "@/lib/types";

interface Props {
  flagged: Report[];
}

export function StoresToAvoid({ flagged }: Props) {
  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, -8, 8, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 4 }}>
            <ShieldAlert className="h-4 w-4 text-red-400" />
          </motion.div>
          <h2 className="text-sm font-semibold text-white">Stores to Avoid</h2>
          <motion.span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}>
            {flagged.length}
          </motion.span>
        </div>
        <Link href="/dashboard/report-scam"
          className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
          Report a scam <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Store cards */}
      <div className="space-y-2">
        {flagged.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.35, type: "spring", stiffness: 300, damping: 25 }}>
            <Link href={`/report/${r.id}`}>
              <motion.div
                className="group relative flex items-center gap-4 rounded-xl px-4 py-3 cursor-pointer overflow-hidden"
                style={{ border: "1px solid rgba(239,68,68,0.14)", background: "rgba(239,68,68,0.03)" }}
                whileHover={{ scale: 1.01, borderColor: "rgba(239,68,68,0.35)" }}
                transition={{ duration: 0.2 }}>

                {/* Animated pulse glow on left edge */}
                <motion.div
                  className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full"
                  style={{ background: "linear-gradient(180deg, #ef4444, #f97316)" }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Avatar */}
                <div className="h-9 w-9 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                  {r.domain.slice(0, 2).toUpperCase()}
                </div>

                {/* Store info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-red-200 transition-colors">{r.storeName}</p>
                  <p className="text-xs text-gray-600 truncate">{r.domain}</p>
                </div>

                {/* Score + verdict */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-red-400">{r.trustScore}</span>
                  <div className="flex items-center gap-1 text-xs font-medium text-red-400">
                    {r.verdict === "SKIP"
                      ? <XCircle className="h-3.5 w-3.5" />
                      : <AlertTriangle className="h-3.5 w-3.5" />}
                    {r.verdict}
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
