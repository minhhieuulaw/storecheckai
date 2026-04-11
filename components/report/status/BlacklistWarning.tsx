"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

const EASE = [0.4, 0, 0.2, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: EASE },
};

export interface ScamWarning {
  id: string;
  content: string;
  createdAt: string;
}

export function BlacklistWarning({ warnings }: { warnings: ScamWarning[] }) {
  if (warnings.length === 0) return null;

  return (
    <motion.div {...fadeUp} className="mb-5 rounded-2xl px-5 py-4"
      style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.3)" }}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-300 mb-1">
            ⚠️ This store has been reported as a scam by {warnings.length} user{warnings.length > 1 ? "s" : ""}
          </p>
          <ul className="space-y-1.5 mt-2">
            {warnings.map(w => (
              <li key={w.id} className="text-xs text-gray-400 leading-relaxed border-l-2 pl-3"
                style={{ borderColor: "rgba(239,68,68,0.4)" }}>
                &ldquo;{w.content.slice(0, 120)}{w.content.length > 120 ? "…" : ""}&rdquo;
                <span className="ml-2 text-gray-600">{new Date(w.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
