import { ImageResponse } from "@vercel/og";
import { getReport } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    return new Response("Not found", { status: 404 });
  }

  const score   = report.trustScore;
  const store   = report.storeName;
  const domain  = report.domain;
  const verdict = report.verdict;

  const scoreColor =
    score >= 70 ? "#4ade80" :
    score >= 45 ? "#facc15" : "#f87171";

  const verdictLabel =
    verdict === "BUY"     ? "SAFE TO BUY" :
    verdict === "CAUTION" ? "USE CAUTION" : "AVOID";

  const verdictColor =
    verdict === "BUY"     ? "#4ade80" :
    verdict === "CAUTION" ? "#facc15" : "#f87171";

  const verdictBg =
    verdict === "BUY"     ? "rgba(74,222,128,0.12)" :
    verdict === "CAUTION" ? "rgba(250,204,21,0.12)"  : "rgba(248,113,113,0.12)";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#07070f",
          display: "flex",
          flexDirection: "column",
          padding: "64px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}>

        {/* Background glow */}
        <div style={{
          position: "absolute", top: "-100px", left: "-100px",
          width: "600px", height: "600px", borderRadius: "9999px",
          background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
        }} />

        {/* StorecheckAI brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "auto" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ width: "18px", height: "18px", background: "white", borderRadius: "4px" }} />
          </div>
          <span style={{ color: "white", fontSize: "18px", fontWeight: "700" }}>StorecheckAI</span>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Store name */}
          <div style={{ color: "white", fontSize: "52px", fontWeight: "800", lineHeight: 1.1 }}>
            {store.length > 30 ? store.slice(0, 30) + "…" : store}
          </div>
          <div style={{ color: "rgba(156,163,175,1)", fontSize: "22px" }}>{domain}</div>

          {/* Score + verdict row */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px", marginTop: "16px" }}>
            {/* Score circle */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              background: "rgba(255,255,255,0.05)", borderRadius: "20px",
              padding: "20px 28px", border: "1px solid rgba(255,255,255,0.1)",
            }}>
              <span style={{ color: scoreColor, fontSize: "56px", fontWeight: "900", lineHeight: 1 }}>{score}</span>
              <span style={{ color: "rgba(107,114,128,1)", fontSize: "14px", marginTop: "4px" }}>out of 100</span>
            </div>

            {/* Verdict badge */}
            <div style={{
              display: "flex", alignItems: "center",
              background: verdictBg, borderRadius: "16px",
              padding: "16px 28px", border: `1px solid ${verdictColor}40`,
            }}>
              <span style={{ color: verdictColor, fontSize: "32px", fontWeight: "800" }}>{verdictLabel}</span>
            </div>

            {/* Signals count */}
            <div style={{
              display: "flex", flexDirection: "column",
              background: "rgba(255,255,255,0.03)", borderRadius: "16px",
              padding: "16px 24px", border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <span style={{ color: "white", fontSize: "28px", fontWeight: "700" }}>20+</span>
              <span style={{ color: "rgba(107,114,128,1)", fontSize: "14px" }}>signals checked</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: "32px", paddingTop: "20px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ color: "rgba(107,114,128,1)", fontSize: "16px" }}>
            AI-powered store safety analysis
          </span>
          <span style={{ color: "rgba(99,102,241,1)", fontSize: "16px", fontWeight: "600" }}>
            storecheckai.com
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
