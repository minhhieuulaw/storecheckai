"use client";

import { useParams } from "next/navigation";

/**
 * Report V2 — Bento Executive Dashboard
 *
 * Parallel route for internal QA. Access via /report/:id/v2
 * Uses --v2-* design tokens from globals.css
 * Font: Geist (sans) + Fraunces (display serif via --v2-font-display)
 *
 * TODO: section-by-section redesign (each = 1 commit)
 */
export default function ReportPageV2() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--v2-bg)" }}
    >
      {/* Scaffold header */}
      <div
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: "var(--v2-surface)",
          borderBottom: "1px solid var(--v2-border)",
        }}
      >
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--v2-text)" }}
        >
          StorecheckAI
        </span>
        <span
          className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
          style={{
            background: "var(--v2-accent-glow)",
            color: "var(--v2-accent)",
            border: "1px solid var(--v2-accent)",
          }}
        >
          V2 Preview
        </span>
      </div>

      {/* Scaffold body */}
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div
          className="rounded-2xl p-8"
          style={{
            background: "var(--v2-surface)",
            border: "1px solid var(--v2-border)",
            boxShadow: "var(--v2-shadow-card)",
            borderRadius: "var(--v2-radius-lg)",
          }}
        >
          <h1
            className="text-2xl font-bold mb-2"
            style={{
              fontFamily: "var(--v2-font-display)",
              color: "var(--v2-text)",
            }}
          >
            Report V2 — Bento Executive Dashboard
          </h1>
          <p
            className="text-sm mb-6"
            style={{ color: "var(--v2-text-secondary)" }}
          >
            Report ID: <code className="font-mono" style={{ color: "var(--v2-accent)" }}>{id}</code>
          </p>

          {/* Token verification grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Success", color: "var(--v2-success)" },
              { label: "Warning", color: "var(--v2-warning)" },
              { label: "Danger", color: "var(--v2-danger)" },
              { label: "Accent", color: "var(--v2-accent)" },
            ].map(({ label, color }) => (
              <div
                key={label}
                className="rounded-xl p-3 text-center text-xs font-bold uppercase tracking-wider"
                style={{
                  background: "var(--v2-surface-raised)",
                  border: `1px solid ${color}`,
                  color,
                  borderRadius: "var(--v2-radius-md)",
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Data source badge samples */}
          <p
            className="text-xs uppercase tracking-wider mb-3"
            style={{ color: "var(--v2-text-muted)" }}
          >
            Data Source Badges
          </p>
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { label: "LIVE", color: "var(--v2-src-live)" },
              { label: "LIVE SCRAPED", color: "var(--v2-src-scraped)" },
              { label: "HYBRID EST.", color: "var(--v2-src-hybrid)" },
              { label: "AI ESTIMATE", color: "var(--v2-src-ai)" },
              { label: "PARTIAL", color: "var(--v2-src-partial)" },
            ].map(({ label, color }) => (
              <span
                key={label}
                className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: `color-mix(in srgb, ${color} 12%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                  color,
                }}
              >
                {label === "LIVE" && "● "}{label}
              </span>
            ))}
          </div>

          {/* Verdict color samples */}
          <p
            className="text-xs uppercase tracking-wider mb-3"
            style={{ color: "var(--v2-text-muted)" }}
          >
            Verdict Colors
          </p>
          <div className="flex gap-3 mb-6">
            {[
              { label: "BUY", color: "var(--v2-verdict-buy)" },
              { label: "CAUTION", color: "var(--v2-verdict-caution)" },
              { label: "SKIP", color: "var(--v2-verdict-skip)" },
            ].map(({ label, color }) => (
              <span
                key={label}
                className="text-2xl font-bold"
                style={{
                  fontFamily: "var(--v2-font-display)",
                  color,
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Font check */}
          <p
            className="text-xs uppercase tracking-wider mb-3"
            style={{ color: "var(--v2-text-muted)" }}
          >
            Typography
          </p>
          <p className="text-xl font-semibold mb-1" style={{ fontFamily: "var(--v2-font-display)", color: "var(--v2-text)" }}>
            Fraunces Display — The quick brown fox
          </p>
          <p className="text-base mb-1" style={{ fontFamily: "var(--v2-font-sans)", color: "var(--v2-text-secondary)" }}>
            Geist Sans — Body text for readable paragraphs
          </p>
          <p className="text-sm font-mono" style={{ color: "var(--v2-text-muted)" }}>
            Geist Mono — storecheckai.com · #oYg1Lh7r0N · $29.99
          </p>
        </div>

        {/* Placeholder sections */}
        <p
          className="text-center text-xs mt-8"
          style={{ color: "var(--v2-text-dim)" }}
        >
          Sections will be added one commit at a time. V1 route is untouched.
        </p>
      </main>
    </div>
  );
}
