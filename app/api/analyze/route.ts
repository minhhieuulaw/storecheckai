export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { scrapeStore } from "@/lib/scraper";
import { calculateTrustScore, calculateReturnRisk } from "@/lib/scoring";
import { analyzeWithAI, analyzeMainProductPrice, getAmazonRecommendations, getAliExpressRecommendations, extractProductIntel, buildFallbackIntel } from "@/lib/analyze";
import { detectDropshipRisk, estimateLandedCost } from "@/lib/dropship-detection";
import { detectUserCountry } from "@/lib/user-country";
import { saveReport, saveAnalysisFailure } from "@/lib/store";
import { verifySession, findUserById } from "@/lib/auth";
import { useCheck, addChecks, PLAN_FEATURES, type PlanTier } from "@/lib/quota";
import { sendCheckCompleteEmail } from "@/lib/email";
import { getDomainScamSummary } from "@/lib/scam-reports";
import type { Report, AnalyzeResponse } from "@/lib/types";

export const maxDuration = 60;

// ── Analysis cache: domain → cached analysis (5-minute TTL) ───────────────────
type CachedAnalysis = {
  scraped: Awaited<ReturnType<typeof scrapeStore>>;
  rawScore: number;
  signals: ReturnType<typeof calculateTrustScore>["signals"];
  returnRiskRules: ReturnType<typeof calculateReturnRisk>["risk"];
  ai: Awaited<ReturnType<typeof analyzeWithAI>>;
  productIntel: Awaited<ReturnType<typeof extractProductIntel>>;
  expiresAt: number;
};
const analysisCache = new Map<string, CachedAnalysis>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_TTL_NULL_INTEL_MS = 30 * 1000; // 30s when intel is null so we retry sooner

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

// Periodic cleanup — evict expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rl) { if (now > v.resetAt) rl.delete(k); }
  for (const [k, v] of analysisCache) { if (now > v.expiresAt) analysisCache.delete(k); }
}, 10 * 60 * 1000).unref();

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
  let analyzedUrl = "";

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
    analyzedUrl = url;
    if (!isValidUrl(url)) return NextResponse.json({ success: false, error: "Please enter a valid URL (e.g. https://mystore.com)." }, { status: 400 });
    const restriction = checkUrlRestrictions(url);
    if (restriction) return NextResponse.json({ success: false, error: restriction }, { status: 400 });

    // ── 5. Scrape + Score + AI (with URL-level cache) ─────────────────────────
    // Cache key is full URL (origin + pathname) not just domain — different product
    // pages on the same store have different intel and shouldn't share cache.
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, "");
    const cacheKey = `${urlObj.origin}${urlObj.pathname}`;
    const now = Date.now();
    const cached = analysisCache.get(cacheKey);
    let scraped: CachedAnalysis["scraped"];
    let rawScore: number;
    let signals: CachedAnalysis["signals"];
    let returnRiskRules: CachedAnalysis["returnRiskRules"];
    let ai: CachedAnalysis["ai"];
    let productIntelResult: Awaited<ReturnType<typeof extractProductIntel>> = null;

    if (cached && now < cached.expiresAt) {
      ({ scraped, rawScore, signals, returnRiskRules, ai } = cached);
      productIntelResult = cached.productIntel;
    } else {
      scraped = await scrapeStore(url);
      ({ trustScore: rawScore, signals } = calculateTrustScore(scraped));
      ({ risk: returnRiskRules } = calculateReturnRisk(scraped));

      // Run product intel + Claude analysis in PARALLEL to reduce total latency.
      // Intel has 20s hard timeout inside the call — swallow errors to null and
      // downstream code will compute a fallback intel from scraped.products.
      const intelPromise = scraped.pageContent
        ? extractProductIntel(scraped.pageContent, scraped.products, scraped.pageTitle, url)
            .catch(() => null)
        : Promise.resolve(null);

      const [intelRes, aiWithoutIntel] = await Promise.all([
        intelPromise,
        analyzeWithAI(scraped, rawScore, returnRiskRules, locale, null),
      ]);
      productIntelResult = intelRes;
      ai = aiWithoutIntel;

      // Cache null intel only briefly (30s) so a transient OpenAI timeout doesn't
      // poison the full 5-minute TTL and break all downstream sections.
      const ttl = productIntelResult ? CACHE_TTL_MS : CACHE_TTL_NULL_INTEL_MS;
      analysisCache.set(cacheKey, { scraped, rawScore, signals, returnRiskRules, ai, productIntel: productIntelResult, expiresAt: now + ttl });
    }

    // If OpenAI intel extraction failed/timed out, build a minimal fallback from
    // scraped products so downstream sections (Amazon recs, dropship risk, price
    // check, landed cost) still render instead of all going blank.
    const productIntel = productIntelResult ?? buildFallbackIntel(scraped.products, scraped.pageTitle);

    // Detect buyer country from request headers (Cloudflare/Vercel/Accept-Language)
    // Used to localize Amazon/AliExpress ship-to + landed cost calculation
    const userCountry = detectUserCountry(req);

    // ── 6. Price analysis + Amazon/AliExpress recommendations (parallel) ──
    const [priceAnalysis, amazonRecs, aliRecs] = await Promise.all([
      planFeatures.priceAnalysis ? analyzeMainProductPrice(productIntel, scraped.products, scraped.ogImage, url) : Promise.resolve([]),
      getAmazonRecommendations(
        scraped.products, domain,
        { pageTitle: scraped.pageTitle, ogDescription: scraped.ogDescription ?? undefined },
        productIntel,
        userCountry,
      ).catch(err => { console.error("Amazon recs failed:", err); return []; }),
      getAliExpressRecommendations(
        productIntel,
        { pageTitle: scraped.pageTitle },
        userCountry,
      ).catch(err => { console.error("AliExpress recs failed:", err); return []; }),
    ]);

    // ── 7. Community scam reports ───────────────────────────────────────────
    const communityReports = await getDomainScamSummary(domain).catch(() => ({ count: 0, snippets: [] }));

    // ── 7b. Dropship risk + landed cost (localized per user country) ───────
    const dropshipRisk = detectDropshipRisk(productIntel, aliRecs, amazonRecs, scraped) ?? undefined;
    const landedCost = estimateLandedCost(productIntel, scraped, userCountry) ?? undefined;

    // If dropshipRisk is critical/high, bump trustScore penalty
    let dropshipPenalty = 0;
    if (dropshipRisk?.level === "critical") dropshipPenalty = -15;
    else if (dropshipRisk?.level === "high") dropshipPenalty = -10;
    else if (dropshipRisk?.level === "medium") dropshipPenalty = -5;

    const finalTrustScore = Math.min(100, Math.max(0, rawScore + ai.trustScoreAdjustment + dropshipPenalty));

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
      reviewSummary: ai.reviewSummary || undefined,
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
      amazonRecommendations: amazonRecs.length > 0 ? amazonRecs : undefined,
      aliexpressRecommendations: aliRecs.length > 0 ? aliRecs : undefined,
      dropshipRisk,
      landedCost,

      paymentMethods:       planFeatures.fullReport ? scraped.paymentMethods       : [],
      shippingOriginSignals: planFeatures.fullReport ? scraped.shippingOriginSignals : [],
      trustpilotRating:     planFeatures.fullReport ? scraped.trustpilotRating      : null,
      trustpilotReviewCount: planFeatures.fullReport ? scraped.trustpilotReviewCount : null,
      trustpilotReviews:    planFeatures.fullReport ? (ai.translatedReviews?.length ? ai.translatedReviews : scraped.trustpilotReviews) : [],
      trustpilotGoodReviews: planFeatures.fullReport ? scraped.trustpilotGoodReviews : [],
      trustpilotBadReviews:  planFeatures.fullReport ? scraped.trustpilotBadReviews  : [],
      manipulationTactics:  scraped.manipulationTactics,  // always shown — safety-critical info
      reviewPlatforms:      planFeatures.fullReport ? scraped.reviewPlatforms       : [],

      communityReports: communityReports.count > 0 ? communityReports : undefined,

      nonDeliveryRisk: ai.nonDeliveryRisk,
      scamPatterns:    ai.scamPatterns,

      productIntel:  productIntel ?? undefined,

      ogImage:       scraped.ogImage,
      isPartialData: !!scraped.scrapeError,
      scrapeError:   scraped.scrapeError,
    };

    // ── 9. Persist report ─────────────────────────────────────────────────
    // ALWAYS save — otherwise the /report/{id} page 404s and the user loses
    // their quota without seeing results. `savedHistory` plan flag only
    // controls whether userId is attached (for dashboard history listing).
    try {
      await saveReport(report);
    } catch (saveErr) {
      // If save fails, refund the check — user should not lose quota
      console.error("saveReport failed:", saveErr);
      if (checkConsumed && refundUserId) {
        await addChecks(refundUserId, 1).catch(() => {});
        checkConsumed = false;
      }
      throw saveErr; // propagate to outer catch → 500 response
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
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : undefined;
    console.error("Analyze error:", { message: errMsg, stack: errStack });

    // Save failure log for admin review
    if (analyzedUrl) {
      const errorType = errMsg.includes("timeout") || errMsg.includes("abort") ? "timeout"
        : errMsg.includes("fetch") || errMsg.includes("ECONNREFUSED") ? "scrape_error"
        : errMsg.includes("Claude") || errMsg.includes("OpenAI") || errMsg.includes("API") ? "ai_error"
        : "unknown";
      const parsedUrl = (() => { try { return new URL(analyzedUrl.startsWith("http") ? analyzedUrl : `https://${analyzedUrl}`); } catch { return null; } })();
      saveAnalysisFailure({
        userId: refundUserId ?? undefined,
        url: analyzedUrl,
        domain: parsedUrl?.hostname.replace("www.", "") ?? analyzedUrl,
        errorType,
        errorMsg: `${errMsg}\n${errStack ?? ""}`.slice(0, 2000),
        userAgent: req.headers.get("user-agent") ?? undefined,
      }).catch(e => console.error("Failed to log analysis failure:", e));
    }

    if (checkConsumed && refundUserId) {
      await addChecks(refundUserId, 1).catch(() => {});
    }
    return NextResponse.json({ success: false, error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
