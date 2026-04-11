"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Share2, Shield } from "lucide-react";

export function ReportNavbar({
  isLoggedIn,
  copied,
  onShare,
}: {
  isLoggedIn: boolean | null;
  copied: boolean;
  onShare: () => void;
}) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5"
      style={{
        background: "rgba(7,7,15,0.92)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}>
      <a
        href={isLoggedIn ? "/dashboard" : "/"}
        className="group flex items-center gap-2 text-sm text-gray-500 hover:text-gray-200 transition-colors">
        <motion.div whileHover={{ x: -3 }} transition={{ duration: 0.15 }}>
          <ArrowLeft className="h-4 w-4" />
        </motion.div>
        {isLoggedIn ? "Dashboard" : "Check another store"}
      </a>
      <div className="flex items-center gap-2">
        <motion.button
          onClick={onShare}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all"
          style={{
            borderColor: copied ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.1)",
            color: copied ? "#4ade80" : "#9ca3af",
            background: "rgba(255,255,255,0.02)",
          }}>
          <Share2 className="h-3.5 w-3.5" />
          {copied ? "Copied!" : "Share"}
        </motion.button>
        <a
          href="/"
          className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
          <Shield className="h-3.5 w-3.5" />
          StorecheckAI
        </a>
      </div>
    </motion.nav>
  );
}
