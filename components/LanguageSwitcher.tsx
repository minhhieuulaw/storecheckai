"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { useTranslation, LOCALES, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LOCALES[locale];

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-xl transition-all hover:text-white"
        style={{
          padding: compact ? "6px 10px" : "7px 12px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#9ca3af",
        }}>
        <span className="text-base leading-none">{current.flag}</span>
        {!compact && (
          <span className="text-xs font-medium">{current.nativeName}</span>
        )}
        <ChevronDown
          className="h-3 w-3 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 top-full mt-2 z-[100] rounded-2xl overflow-hidden"
            style={{
              background: "rgba(10,10,22,0.97)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
              minWidth: 168,
            }}>
            <div className="py-1.5">
              {(Object.entries(LOCALES) as [Locale, typeof LOCALES[Locale]][]).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => { setLocale(key); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/[0.05]"
                  style={{ color: locale === key ? "#fff" : "#9ca3af" }}>
                  <span className="text-base">{val.flag}</span>
                  <span className="font-medium flex-1 text-left">{val.nativeName}</span>
                  {locale === key && (
                    <Check className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
