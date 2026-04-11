"use client";

import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

const viewportOnce = { once: true };

export function ReturnPolicy({ returnSummary }: { returnSummary: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.4 }}
      className="mb-4 rounded-2xl p-5"
      style={{ background: "rgba(251,146,60,0.04)", border: "1px solid rgba(251,146,60,0.1)" }}>
      <p className="text-xs font-semibold text-orange-400 mb-2.5 flex items-center gap-1.5">
        <RotateCcw className="h-3.5 w-3.5" /> Return & Refund Policy
      </p>
      <p className="text-sm text-gray-300 leading-relaxed">{returnSummary}</p>
    </motion.div>
  );
}
