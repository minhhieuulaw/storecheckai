"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import type React from "react";

export interface MobileVerdictConfig {
  Icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  label: string;
}

export function MobileStickyVerdictBar({
  verdictConfig,
  trustScore,
  trustColor,
  isLoggedIn,
}: {
  verdictConfig: MobileVerdictConfig;
  trustScore: number;
  trustColor: string;
  isLoggedIn: boolean | null;
}) {
  const { Icon: VIcon, color, bg, border, label } = verdictConfig;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.35 }}
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: "rgba(7,7,15,0.96)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Verdict pill */}
        <div className="flex items-center gap-1.5 rounded-xl px-3 py-2 shrink-0"
          style={{ background: bg, border: `1px solid ${border}` }}>
          <VIcon className="h-4 w-4" style={{ color }} />
          <span className="text-xs font-bold" style={{ color }}>{label}</span>
        </div>
        {/* Score chip */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-lg font-extrabold tabular-nums" style={{ color: trustColor }}>{trustScore}</span>
          <span className="text-[10px] text-gray-600">/100</span>
        </div>
        {/* Spacer */}
        <div className="flex-1" />
        {/* Check another CTA */}
        <a
          href={isLoggedIn ? "/dashboard" : "/"}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shrink-0"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
          <Shield className="h-3.5 w-3.5" />
          {isLoggedIn ? "Dashboard" : "Check another"}
        </a>
      </div>
    </motion.div>
  );
}
