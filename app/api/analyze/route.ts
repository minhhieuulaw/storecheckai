export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { scrapeStore } from "@/lib/scraper";
import { calculateTrustScore, calculateReturnRisk } from "@/lib/scoring";
import { analyzeWithAI, analyzeProductPrices } from "@/lib/analyze";
import { saveReport } from "@/lib/store";
import { verifySession, findUserById } from "@/lib/auth";
import { useCheck, PLAN_FEATURES, type PlanTier } from "@/lib/quota";
import type { Report, AnalyzeResponse } from "@/lib/types";

export const maxDuration = 60;

// ── Simple in-memory rate limiter (per process instance) ──────────────────────
const rl = new Map<string, { count: number; resetAt: number }>();
function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rl.get(key);
  if (!entry || now > entry.resetAt) { rl.set(key, { count: 1, resetAt: now + windowMs }); return true; }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

function isValidUrl(raw: string): boolean {
  try { const u = new URL(raw); return u.protocol === "http:" || u.protocol === "https:"; }
  catch { return false; }
}
function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;
  return url;
}
function extractStoreName(pageTitle: string, domain: string): string {
  if (pageTitle && pageTitle.length > 0 && pageTitle !== domain)
    return pageTitle.split(/[|\-–—]/)[0].trim().slice(0, 60) || domain;
  return domain;
}

export async function POST(req: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    // ── 1. Rate limiting (IP-based) ──────────────────────────────────────────
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!rateLimit(ip, 10, 60_000)) {
      return NextResponse.json({ success: false, error: "Too many requests. Please wait a moment." }, { status: 429 });
    }

    // ── 2. Auth ──────────────────────────────────────────────────────────────
    const token = req.cookies.get("session")?.value;
    const session = token ? await verifySession(token) : null;
    if (!session?.sub) {
      return NextResponse.json({ success: false, error: "Login required." }, { status: 401 });
    }

    const user = await findUserById(session.sub);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 401 });
    }

    // ── 3. Quota check ───────────────────────────────────────────────────────
    const { success: hasQuota, remaining, plan } = await useCheck(user.id);
    if (!hasQuota) {
      return NextResponse.json({
        success: false,
        error: `You've used all your checks. Upgrade your plan to continue. (${remaining} remaining)`,
        code: "QUOTA_EXCEEDED",
      } as AnalyzeResponse & { code: string }, { status: 402 });
    }

    const planFeatures = PLAN_FEATURES[plan as PlanTier] ?? PLAN_FEATURES.free;

    // ── 4. Validate URL ──────────────────────────────────────────────────────
    const body = await req.json();
    const rawUrl = body?.url as string;
    if (!rawUrl) return NextResponse.json({ success: false, error: "URL is required." }, { status: 400 });
    const url = normalizeUrl(rawUrl);
    if (!isValidUrl(url)) return NextResponse.json({ success: false, error: "Please enter a valid URL." }, { status: 400 });

    // ── 5. Scrape ────────────────────────────────────────────────────────────
    const scraped = await scrapeStore(url);

    // ── 6. Scoring ───────────────────────────────────────────────────────────
    const { trustScore: rawScore, signals } = calculateTrustScore(scraped);
    const { risk: returnRiskRules } = calculateReturnRisk(scraped);

    // ── 7. AI analysis (parallel) ────────────────────────────────────────────
    const [ai, priceAnalysis] = await Promise.all([
      analyzeWithAI(scraped, rawScore, returnRiskRules),
      planFeatures.priceAnalysis ? analyzeProductPrices(scraped.products) : Promise.resolve([]),
    ]);

    const finalTrustScore = Math.min(100, Math.max(0, rawScore + ai.trustScoreAdjustment));

    // ── 8. Assemble report (gate by plan) ────────────────────────────────────
    const id = nanoid(10);
    const report: Report = {
      id,
      userId: planFeatures.savedHistory ? user.id : undefined,
      planUsed: plan,
      url,
      domain: scraped.domain,
      storeName: extractStoreName(scraped.pageTitle, scraped.domain),
      analyzedAt: new Date().toISOString(),

      trustScore: finalTrustScore,
      returnRisk: ai.returnRisk,
      reviewConfidence: ai.reviewConfidence,
      verdict: ai.verdict,

      verdictReason: ai.verdictReason,
      pros:       ai.pros,
      cons:       ai.cons,
      complaints: planFeatures.fullReport ? ai.complaints       : [],
      storeSignals: planFeatures.fullReport ? signals            : signals.slice(0, 4),
      redFlags:   planFeatures.fullReport ? ai.redFlags          : [],
      returnSummary: ai.returnSummary,
      suspiciousSignals: planFeatures.fullReport ? ai.suspiciousSignals : [],
      whoShouldBuy:  planFeatures.fullReport ? ai.whoShouldBuy  : "",
      whoShouldAvoid: planFeatures.fullReport ? ai.whoShouldAvoid : "",
      finalTake:  ai.finalTake,

      products:      scraped.products,
      priceAnalysis: planFeatures.priceAnalysis ? priceAnalysis : [],

      paymentMethods:       planFeatures.fullReport ? scraped.paymentMethods       : [],
      shippingOriginSignals: planFeatures.fullReport ? scraped.shippingOriginSignals : [],
      trustpilotRating:     planFeatures.fullReport ? scraped.trustpilotRating      : null,
      trustpilotReviewCount: planFeatures.fullReport ? scraped.trustpilotReviewCount : null,
      manipulationTactics:  planFeatures.fullReport ? scraped.manipulationTactics  : [],
      reviewPlatforms:      planFeatures.fullReport ? scraped.reviewPlatforms       : [],

      ogImage:       scraped.ogImage,
      isPartialData: !!scraped.scrapeError,
      scrapeError:   scraped.scrapeError,
    };

    // ── 9. Persist (only if plan supports history) ───────────────────────────
    if (planFeatures.savedHistory) {
      await saveReport(report);
    }

    return NextResponse.json({
      success: true,
      reportId: id,
      report,
      checksRemaining: remaining,
    });
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json({ success: false, error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
