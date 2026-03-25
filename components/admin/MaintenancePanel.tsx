"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WrenchIcon, X, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { MaintenanceSettings } from "@/lib/admin";

interface Props {
  initial: MaintenanceSettings;
  onClose: () => void;
  onSave: (data: MaintenanceSettings) => void;
}

// Duration presets in minutes
const PRESETS = [
  { label: "30 min",  mins: 30  },
  { label: "1 hour",  mins: 60  },
  { label: "2 hours", mins: 120 },
  { label: "4 hours", mins: 240 },
  { label: "Tonight", mins: 480 },
  { label: "Custom",  mins: -1  },
  { label: "No end",  mins: 0   },
];

export function MaintenancePanel({ initial, onClose, onSave }: Props) {
  const [enabled,  setEnabled]  = useState(initial.enabled);
  const [message,  setMessage]  = useState(initial.message);
  const [preset,   setPreset]   = useState<number | null>(null);
  const [customEnd, setCustomEnd] = useState(
    initial.endsAt ? new Date(initial.endsAt).toISOString().slice(0, 16) : ""
  );
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  function computeEndsAt(): string | null {
    if (!enabled) return null;
    if (preset === 0) return null;   // no end
    if (preset && preset > 0) {
      return new Date(Date.now() + preset * 60_000).toISOString();
    }
    if (preset === -1 && customEnd) {
      return new Date(customEnd).toISOString();
    }
    if (initial.endsAt) return initial.endsAt;
    return null;
  }

  async function handleSave() {
    setSaving(true);
    const data: MaintenanceSettings = {
      enabled,
      message: message.trim() || "We're performing scheduled maintenance. We'll be back shortly.",
      endsAt: computeEndsAt(),
    };
    await fetch("/api/admin/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => onSave(data), 800);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg rounded-3xl p-6"
          style={{ background: "#0c0c1a", border: "1px solid rgba(255,255,255,0.1)" }}>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="rounded-xl p-2"
                style={{ background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.25)" }}>
                <WrenchIcon className="h-4 w-4" style={{ color: "#fbbf24" }} />
              </div>
              <h2 className="text-base font-bold text-white">Maintenance Mode</h2>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Enable toggle */}
          <div className="flex items-center justify-between rounded-2xl p-4 mb-4"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div>
              <p className="text-sm font-medium text-gray-200">Enable Maintenance Mode</p>
              <p className="text-xs text-gray-500 mt-0.5">Shows maintenance page to all visitors</p>
            </div>
            <button
              onClick={() => setEnabled(e => !e)}
              className="relative h-6 w-11 rounded-full transition-all duration-200"
              style={{ background: enabled ? "#6366f1" : "rgba(255,255,255,0.1)" }}>
              <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200"
                style={{ left: enabled ? "calc(100% - 22px)" : "2px" }} />
            </button>
          </div>

          {/* Message */}
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Maintenance Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-gray-200 resize-none outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              placeholder="We're performing scheduled maintenance…"
            />
          </div>

          {/* Duration presets */}
          {enabled && (
            <div className="mb-5">
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">Duration</label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(p => (
                  <button key={p.label}
                    onClick={() => setPreset(p.mins)}
                    className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                    style={{
                      background: preset === p.mins ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                      border: preset === p.mins ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.08)",
                      color: preset === p.mins ? "#a5b4fc" : "#9ca3af",
                    }}>
                    {p.label}
                  </button>
                ))}
              </div>
              {preset === -1 && (
                <input
                  type="datetime-local"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="mt-3 w-full rounded-xl px-3 py-2 text-sm text-gray-200 outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              )}
            </div>
          )}

          {/* Warning */}
          {enabled && (
            <div className="flex items-start gap-2 rounded-xl p-3 mb-5"
              style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.18)" }}>
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "#fbbf24" }} />
              <p className="text-xs text-yellow-600">
                Maintenance mode will show a "down for maintenance" page to all non-admin visitors.
                Admin access remains available.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 rounded-xl py-2.5 text-sm font-medium text-gray-400 transition-colors hover:text-white"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || saved}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              style={{ background: saved ? "rgba(34,197,94,0.8)" : "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              {saved
                ? <><CheckCircle2 className="h-4 w-4" /> Saved!</>
                : saving ? "Saving…" : "Save & Apply"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
