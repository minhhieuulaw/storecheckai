"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, ChevronDown } from "lucide-react";
import type { StoreSignal } from "@/lib/types";

const SIGNAL_LABELS: Record<string, string> = {
  "HTTPS Secure": "Secure website connection",
  "Security Headers": "Advanced security protection",
  "Return Policy": "Has a return/refund policy",
  "Privacy Policy": "Has a privacy policy",
  "Terms of Service": "Has terms of service",
  "Contact Page": "Has a dedicated contact page",
  "Shipping Policy": "Has a shipping policy",
  "Business Email": "Uses a professional email address",
  "Contact Email": "Has a contact email",
  "Phone Number": "Phone number listed",
  "Physical Address": "Physical address listed",
  "About Page": "Has an About Us page",
  "Payment Methods": "Accepts trusted payment options",
  "Domain Age": "Store age & history",
  "Social Presence": "Active on social media",
  "Trustpilot": "Trustpilot reputation",
  "Business Registration": "Registered business entity",
  "Customer Reviews": "Customer review system",
  "Cookie Consent": "Data privacy compliance",
  "Dark Patterns": "Uses pressure sales tactics",
  "Domain Redirect": "Website redirect detected",
};

export function HealthBucket({
  type, label, count, signals,
}: {
  type: "pass" | "warn" | "fail";
  label: string;
  count: number;
  signals: StoreSignal[];
}) {
  const [open, setOpen] = useState(false);
  const color  = type === "pass" ? "#4ade80" : type === "fail" ? "#f87171" : "#fbbf24";
  const Icon   = type === "pass" ? CheckCircle2 : type === "fail" ? XCircle : AlertCircle;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-colors"
      style={{ background: `${color}06`, border: `1px solid ${color}18` }}>
      <button
        className="w-full flex items-center justify-between gap-2 p-4 transition-colors hover:bg-white/[0.025]"
        onClick={() => count > 0 && setOpen(!open)}>
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 shrink-0" style={{ color }} />
          <span className="text-xs font-semibold truncate" style={{ color }}>{label}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="rounded-full px-2 py-0.5 text-xs font-bold"
            style={{ background: `${color}20`, color }}>
            {count}
          </span>
          {count > 0 && (
            <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-3.5 w-3.5 text-gray-600" />
            </motion.div>
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden">
            <ul className="px-4 pb-4 pt-2 space-y-2.5 border-t" style={{ borderColor: `${color}14` }}>
              {signals.map((s, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.035, duration: 0.2 }}
                  className="flex items-start gap-2 text-xs text-gray-400 leading-relaxed">
                  <Icon className="mt-0.5 h-3 w-3 shrink-0" style={{ color }} />
                  <span>{s.detail || SIGNAL_LABELS[s.name] || s.name}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
