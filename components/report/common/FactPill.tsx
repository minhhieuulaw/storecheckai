"use client";

import type React from "react";

export function FactPill({ text, color, Icon }: { text: string; color: string; Icon: React.ElementType }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap"
      style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {text}
    </div>
  );
}
