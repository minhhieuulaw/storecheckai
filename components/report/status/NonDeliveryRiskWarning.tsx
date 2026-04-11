"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

const EASE = [0.4, 0, 0.2, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: EASE },
};

export function NonDeliveryRiskWarning({
  show,
  scamPatterns,
}: {
  show: boolean;
  scamPatterns: string[] | null | undefined;
}) {
  if (!show) return null;

  return (
    <motion.div {...fadeUp} className="mb-5 rounded-2xl px-5 py-4"
      style={{ background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.35)" }}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-300 mb-1">
            Non-delivery risk detected
          </p>
          <p className="text-xs text-red-400/80 mb-2">
            Customer reviews contain patterns indicating orders may not be fulfilled or refunds refused.
          </p>
          {scamPatterns && scamPatterns.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {scamPatterns.map((p, i) => (
                <span key={i} className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.25)" }}>
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
