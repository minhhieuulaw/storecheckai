"use client";

export function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative flex h-[68px] w-[68px] items-center justify-center shrink-0">
      <svg className="absolute -rotate-90" width="68" height="68" aria-hidden="true">
        <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
        <circle
          cx="34" cy="34" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" opacity="0.85"
        />
      </svg>
      <div className="text-center z-10">
        <div className="text-lg font-bold leading-none" style={{ color }}>{score}</div>
        <div className="text-[9px] text-gray-700 mt-0.5">/100</div>
      </div>
    </div>
  );
}
