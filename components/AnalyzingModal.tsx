"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Globe, FileText, Mail, Brain, Sparkles, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const STEP_ICONS = [Globe, Shield, FileText, Mail, Brain, Sparkles];
const STEP_DURATIONS = [3000, 2500, 3000, 2000, 5000, 2000];

interface Props { url: string; open: boolean; }

export function AnalyzingModal({ url, open }: Props) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (!open) { setCurrentStep(0); setCompletedSteps([]); return; }
    let elapsed = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    STEP_DURATIONS.forEach((dur, i) => {
      timers.push(setTimeout(() => setCurrentStep(i), elapsed));
      elapsed += dur;
      timers.push(setTimeout(() => setCompletedSteps((p) => [...p, i]), elapsed - 400));
    });
    return () => timers.forEach(clearTimeout);
  }, [open]);

  const displayUrl = (() => {
    try {
      const u = new URL(url.startsWith("http") ? url : `https://${url}`);
      return u.hostname.replace("www.", "");
    } catch { return url.slice(0, 40); }
  })();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", background: "rgba(7,7,15,0.85)" }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute h-[500px] w-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)" }}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }} transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 0 60px rgba(99,102,241,0.15)" }}
          >
            <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #c084fc, #6366f1)", backgroundSize: "200% 100%", animation: "shimmer 2s linear infinite" }} />

            <div className="p-8">
              <div className="mb-7 flex items-start gap-4">
                <motion.div
                  animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                >
                  <Shield className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-bold">{t.analyzing.heading}</h3>
                  <p className="mt-0.5 text-sm text-gray-500 truncate max-w-[260px]">{displayUrl}</p>
                </div>
              </div>

              <div className="space-y-3">
                {t.analyzing.steps.map((label, i) => {
                  const isDone    = completedSteps.includes(i);
                  const isActive  = currentStep === i && !isDone;
                  const isPending = currentStep < i;
                  const Icon      = STEP_ICONS[i];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: isPending ? 0.3 : 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.06 }}
                      className="flex items-center gap-3"
                    >
                      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all"
                        style={{
                          background: isDone ? "rgba(34,197,94,0.15)" : isActive ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                          border: isDone ? "1px solid rgba(34,197,94,0.35)" : isActive ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.07)",
                        }}>
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                        ) : isActive ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
                            <Icon className="h-4 w-4" style={{ color: "#818cf8" }} />
                          </motion.div>
                        ) : (
                          <Icon className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <span className="text-sm transition-colors"
                        style={{ color: isDone ? "#4ade80" : isActive ? "#e2e8f0" : "#4b5563" }}>
                        {label}
                      </span>
                      {isActive && (
                        <div className="ml-auto flex gap-1">
                          {[0, 1, 2].map((d) => (
                            <motion.span key={d} className="h-1.5 w-1.5 rounded-full" style={{ background: "#6366f1" }}
                              animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }} />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-7 h-1 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div
                  className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${(completedSteps.length / t.analyzing.steps.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <p className="mt-3 text-center text-xs text-gray-600">{t.analyzing.timeNote}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
