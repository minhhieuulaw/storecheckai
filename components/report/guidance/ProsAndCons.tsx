"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { SectionHeader } from "@/components/report/layout/SectionHeader";

const viewportOnce = { once: true };

export function ProsAndCons({ pros, cons }: { pros: string[]; cons: string[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.4 }}
      className="mb-4">
      <SectionHeader label="Assessment" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div
          className="rounded-2xl p-5"
          style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.1)" }}>
          <p className="text-xs font-semibold text-green-400 mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> What this store does well
          </p>
          {pros.length > 0 ? (
            <ul className="space-y-2">
              {pros.slice(0, 4).map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500/60" />
                  {p}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-gray-600">No notable positives identified.</p>}
        </div>
        <div
          className="rounded-2xl p-5"
          style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)" }}>
          <p className="text-xs font-semibold text-red-400 mb-3 flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5" /> Watch out for
          </p>
          {cons.length > 0 ? (
            <ul className="space-y-2">
              {cons.slice(0, 4).map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400/60" />
                  {c}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-gray-600">No notable negatives identified.</p>}
        </div>
      </div>
    </motion.div>
  );
}
