"use client";

import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

const EASE = [0.4, 0, 0.2, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: EASE },
};

export function PartialDataWarning() {
  return (
    <motion.div {...fadeUp} className="mb-4 rounded-2xl px-5 py-3.5"
      style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.22)" }}>
      <div className="flex items-center gap-3">
        <AlertCircle className="h-4 w-4 text-orange-400 shrink-0" />
        <p className="text-xs text-orange-300 leading-relaxed">
          Some data could not be retrieved from this store (the site may block automated requests).
          Results may be incomplete.
        </p>
      </div>
    </motion.div>
  );
}
