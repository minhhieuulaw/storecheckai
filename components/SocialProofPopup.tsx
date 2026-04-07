"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

// ── Random data pools ─────────────────────────────────────────────────────────

const FIRST_NAMES = [
  "Alex", "Jordan", "Sam", "Casey", "Riley", "Morgan", "Taylor", "Jamie",
  "Avery", "Quinn", "Blake", "Drew", "Sage", "Reese", "Skyler", "Kai",
  "Emma", "Liam", "Noah", "Mia", "Ethan", "Luna", "Leo", "Zoe",
  "Aria", "Eli", "Nora", "Owen", "Ivy", "Finn", "Ruby", "Max",
];

const SUFFIXES = [
  "xx", "22", "99", "_shop", "real", "uk", "us", "de",
  "23", "01", "pro", "88", "vip", "_", "x", "07",
];

function randomNickname(): string {
  const name = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  return `${name}${suffix}`;
}

type Verdict = "BUY" | "CAUTION" | "SKIP";

function randomVerdict(): Verdict {
  const r = Math.random();
  if (r < 0.45) return "BUY";
  if (r < 0.80) return "CAUTION";
  return "SKIP";
}

function randomMinutesAgo(): string {
  const mins = Math.floor(Math.random() * 12) + 1;
  return mins === 1 ? "1 min ago" : `${mins} mins ago`;
}

const VERDICT_CONFIG: Record<Verdict, {
  icon: typeof ShieldCheck;
  label: string;
  message: string;
  accent: string;
  bg: string;
  border: string;
}> = {
  BUY: {
    icon: ShieldCheck,
    label: "Safe Store",
    message: "found a trustworthy store",
    accent: "#4ade80",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.20)",
  },
  CAUTION: {
    icon: ShieldAlert,
    label: "Use Caution",
    message: "flagged a store to watch out for",
    accent: "#fbbf24",
    bg: "rgba(234,179,8,0.08)",
    border: "rgba(234,179,8,0.20)",
  },
  SKIP: {
    icon: ShieldX,
    label: "Risky Store",
    message: "avoided a suspicious store",
    accent: "#f87171",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.20)",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface PopupData {
  id: number;
  nickname: string;
  verdict: Verdict;
  timeAgo: string;
}

export function SocialProofPopup() {
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [counter, setCounter] = useState(0);

  const showNext = useCallback(() => {
    setPopup({
      id: counter,
      nickname: randomNickname(),
      verdict: randomVerdict(),
      timeAgo: randomMinutesAgo(),
    });
    setCounter(c => c + 1);

    // Auto-hide after 4s
    setTimeout(() => setPopup(null), 4000);
  }, [counter]);

  useEffect(() => {
    // First popup after 8-15s
    const initialDelay = 8000 + Math.random() * 7000;
    const firstTimer = setTimeout(showNext, initialDelay);

    return () => clearTimeout(firstTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (popup === null && counter > 0) {
      // Next popup 15-35s after previous one hides
      const nextDelay = 15000 + Math.random() * 20000;
      const timer = setTimeout(showNext, nextDelay);
      return () => clearTimeout(timer);
    }
  }, [popup, counter, showNext]);

  return (
    <div className="fixed bottom-6 left-6 z-50 pointer-events-none" style={{ maxWidth: 340 }}>
      <AnimatePresence mode="wait">
        {popup && (() => {
          const cfg = VERDICT_CONFIG[popup.verdict];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={popup.id}
              initial={{ opacity: 0, y: 30, x: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="pointer-events-auto rounded-2xl px-4 py-3 backdrop-blur-xl shadow-2xl"
              style={{
                background: "rgba(15,15,25,0.85)",
                border: `1px solid ${cfg.border}`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${cfg.border}`,
              }}>
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div
                  className="shrink-0 flex items-center justify-center h-9 w-9 rounded-xl"
                  style={{ background: cfg.bg }}>
                  <Icon className="h-4.5 w-4.5" style={{ color: cfg.accent }} />
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-tight">
                    <span className="font-semibold text-white">{popup.nickname}</span>
                    <span className="text-gray-400"> {cfg.message}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{ background: cfg.bg, color: cfg.accent }}>
                      {cfg.label}
                    </span>
                    <span className="text-[10px] text-gray-600">{popup.timeAgo}</span>
                  </div>
                </div>
              </div>

              {/* Progress bar animation */}
              <motion.div
                className="mt-2 h-[2px] rounded-full origin-left"
                style={{ background: cfg.accent, opacity: 0.3 }}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 4, ease: "linear" }}
              />
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
