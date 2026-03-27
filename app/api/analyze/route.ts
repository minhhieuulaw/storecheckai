export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { scrapeStore } from "@/lib/scraper";
import { calculateTrustScore, calculateReturnRisk } from "@/lib/scoring";
import { analyzeWithAI, analyzeProductPrices } from "@/lib/analyze";
import { saveReport } from "@/lib/store";
import { verifySession, findUserById } from "@/lib/auth";
import { useCheck, addChecks, PLAN_FEATURES, type PlanTier } from "@/lib/quota";
import { sendCheckCompleteEmail } from "@/lib/email";
import type { Report, AnalyzeResponse } from "@/lib/types";

export const maxDuration = 60;

// ── Analysis cache: domain → cached analysis (5-minute TTL) ───────────────────
type CachedAnalysis = {
  scraped: Awaited<ReturnType<typeof scrapeStore>>;
  rawScore: number;
  signals: ReturnType<typeof calculateTrustScore>["signals"];
  returnRiskRules: ReturnType<typeof calculateReturnRisk>["risk"];
  ai: Awaited<ReturnType<typeof analyzeWithAI>>;
  expiresAt: number;
};
const analysisCache = new Map<string, CachedAnalysis>();
const CACHE_TTL_MS = 5 * 60 * 1000;

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

// Marketplace domains that are not independent stores — analyzing them is not useful
const MARKETPLACE_DOMAINS = new Set([
  "amazon.com", "amazon.co.uk", "amazon.de", "amazon.ca", "amazon.com.au",
  "ebay.com", "ebay.co.uk", "etsy.com", "walmart.com", "target.com",
  "bestbuy.com", "homedepot.com", "wayfair.com", "costco.com", "samsclub.com",
  "aliexpress.com", "aliexpress.us", "temu.com", "shein.com", "wish.com",
]);

// URL shortener services that need to be resolved before analysis
const URL_SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "buff.ly",
  "short.io", "rebrand.ly", "lnkd.in", "fb.me",
]);

function isValidUrl(raw: string): boolean {
  try { const u = new URL(raw); return u.protocol === "http:" || u.protocol === "https:"; }
  catch { return false; }
}
function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;
  return url;
}
function checkUrlRestrictions(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    if (MARKETPLACE_DOMAINS.has(hostname)) {
      return "This is a marketplace platform (e.g. Amazon, eBay). Paste the URL of an independent online store instead.";
    }
    if (URL_SHORTENERS.has(hostname)) {
      return "Please paste the full store URL — shortened URLs (bit.ly, t.co, etc.) cannot be analyzed directly.";
    }
  } catch { /* invalid URL handled elsewhere */ }
  return null;
}
function extractStoreName(pageTitle: string, domain: string): string {
  if (pageTitle && pageTitle.length > 0 && pageTitle !== domain)
    return pageTitle.split(/[|\-–—]/)[0].trim().slice(0, 60) || domain;
  return domain;
}

export async function POST(req: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  let checkConsumed = false;
  let refundUserId: string | null = null;

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
    if (user.isBanned) {
      return NextResponse.json({ success: false, error: "Your account has been suspended. Please contact support." }, { status: 403 });
    }

    // ── 3. Quota check ───────────────────────────────────────────────────────
    const { success: hasQuota, remaining, plan } = await useCheck(user.id);
    if (hasQuota) { checkConsumed = true; refundUserId = user.id; }
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
    const locale = (body?.locale as string) || "en";
    if (!rawUrl) return NextResponse.json({ success: false, error: "URL is required." }, { status: 400 });
    const url = normalizeUrl(rawUrl);
    if (!isValidUrl(url)) return NextResponse.json({ success: false, error: "Please enter a valid URL (e.g. https://mystore.com)." }, { status: 400 });
    const restriction = checkUrlRestrictions(url);
    if (restriction) return NextResponse.json({ success: false, error: restriction }, { status: 400 });

    // ── 5. Scrape + Score + AI (with domain-level cache) ─────────────────────
    const domain = new URL(url).hostname.replace(/^www\./, "");
    const now = Date.now();
    const cached = analysisCache.get(domain);
    let scraped: CachedAnalysis["scraped"];
    let rawScore: number;
    let signals: CachedAnalysis["signals"];
    let returnRiskRules: CachedAnalysis["returnRiskRules"];
    let ai: CachedAnalysis["ai"];

    if (cached && now < cached.expiresAt) {
      ({ scraped, rawScore, signals, returnRiskRules, ai } = cached);
    } else {
      scraped = await scrapeStore(url);
      ({ trustScore: rawScore, signals } = calculateTrustScore(scraped));
      ({ risk: returnRiskRules } = calculateReturnRisk(scraped));
      ai = await analyzeWithAI(scraped, rawScore, returnRiskRules, locale);
      analysisCache.set(domain, { scraped, rawScore, signals, returnRiskRules, ai, expiresAt: now + CACHE_TTL_MS });
    }

    // ── 6. Price analysis (never cached — plan-gated) ────────────────────────
    const priceAnalysis = planFeatures.priceAnalysis ? await analyzeProductPrices(scraped.products) : [];

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
      trustpilotReviews:    planFeatures.fullReport ? (ai.translatedReviews?.length ? ai.translatedReviews : scraped.trustpilotReviews) : [],
      manipulationTactics:  planFeatures.fullReport ? scraped.manipulationTactics  : [],
      reviewPlatforms:      planFeatures.fullReport ? scraped.reviewPlatforms       : [],

      nonDeliveryRisk: ai.nonDeliveryRisk,
      scamPatterns:    ai.scamPatterns,

      ogImage:       scraped.ogImage,
      isPartialData: !!scraped.scrapeError,
      scrapeError:   scraped.scrapeError,
    };

    // ── 9. Persist (only if plan supports history) ───────────────────────────
    if (planFeatures.savedHistory) {
      await saveReport(report);
    }

    // Fire-and-forget check-complete email
    sendCheckCompleteEmail(user.email, user.name, report.storeName, report.trustScore, report.verdict, id).catch(() => {});

    return NextResponse.json({
      success: true,
      reportId: id,
      report,
      checksRemaining: remaining,
    });
  } catch (err) {
    console.error("Analyze error:", err);
    if (checkConsumed && refundUserId) {
      await addChecks(refundUserId, 1).catch(() => {});
    }
    return NextResponse.json({ success: false, error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
