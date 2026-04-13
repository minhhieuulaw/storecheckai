"use client";

/**
 * ScoreRingV2 — 120px circular trust score ring (Bento Executive Dashboard)
 * Uses --v2-* tokens. Color prop for verdict-aligned stroke.
 */
export function ScoreRingV2({
  score,
  color,
  size = 120,
}: {
  score: number;
  color: string;
  size?: number;
}) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        className="absolute -rotate-90"
        width={size}
        height={size}
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--v2-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: `stroke-dashoffset var(--v2-dur-slow) var(--v2-ease)` }}
        />
      </svg>
      <div className="text-center z-10">
        <div
          className="leading-none"
          style={{
            color,
            fontFamily: "var(--v2-font-display)",
            fontSize: size * 0.3,
            fontWeight: 700,
          }}
        >
          {score}
        </div>
        <div
          className="mt-1 uppercase tracking-widest"
          style={{
            color: "var(--v2-text-dim)",
            fontSize: size * 0.08,
            fontWeight: 600,
          }}
        >
          / 100
        </div>
      </div>
    </div>
  );
}
