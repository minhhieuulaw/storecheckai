"use client";

import { XCircle, Shield } from "lucide-react";

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div
        className="rounded-2xl p-4"
        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
        <XCircle className="h-10 w-10 text-red-400" />
      </div>
      <div>
        <p className="text-xl font-bold mb-2">Report not found</p>
        <p className="text-gray-500 text-sm mb-6 max-w-sm leading-relaxed">{message}</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
          <Shield className="h-4 w-4" />
          Check a store
        </a>
      </div>
    </div>
  );
}
