"use client";

export function SectionHeader({ label, badge }: { label: string; badge?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-bold uppercase tracking-widest text-gray-300 shrink-0">{label}</span>
      {badge && (
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-indigo-400 shrink-0"
          style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
          {badge}
        </span>
      )}
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
    </div>
  );
}
