"use client";

import { Lock } from "lucide-react";

export function LockedSection({ label }: { label: string }) {
  return (
    <div className="relative rounded-2xl overflow-hidden mb-4"
      style={{ border: "1px solid rgba(99,102,241,0.18)", background: "rgba(99,102,241,0.03)" }}>
      <div className="blur-sm opacity-30 pointer-events-none select-none p-5 space-y-2.5" aria-hidden>
        <div className="h-2.5 w-44 rounded-full bg-gray-700" />
        <div className="h-2.5 w-full rounded-full bg-gray-800" />
        <div className="h-2.5 w-3/4 rounded-full bg-gray-800" />
        <div className="h-2.5 w-1/2 rounded-full bg-gray-800" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
        style={{ backdropFilter: "blur(2px)", background: "rgba(7,7,15,0.65)" }}>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
          <Lock className="h-4 w-4 text-indigo-400" />
        </div>
        <p className="text-xs font-semibold text-gray-300">{label} — Personal plan</p>
        <a href="/dashboard/billing"
          className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-2">
          Upgrade to unlock →
        </a>
      </div>
    </div>
  );
}
