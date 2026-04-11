"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";

const viewportOnce = { once: true };

export function ReportFooter({ isLoggedIn }: { isLoggedIn: boolean | null }) {
  return (
    <>
      {/* Mobile padding so sticky bar doesn't overlap content */}
      <div className="h-20 sm:hidden" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportOnce}
        transition={{ duration: 0.4 }}
        className="hidden sm:flex flex-col items-center gap-3 text-center py-8 border-t"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <motion.a
          href={isLoggedIn ? "/dashboard" : "/"}
          whileHover={{ scale: 1.02, boxShadow: "0 0 24px rgba(99,102,241,0.3)" }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold text-white transition-all"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
          <Shield className="h-4 w-4" />
          {isLoggedIn ? "Back to Dashboard" : "Check another store"}
        </motion.a>
        <p className="text-[11px] text-gray-700">
          StorecheckAI · Analysis for informational purposes only
        </p>
      </motion.div>
    </>
  );
}
