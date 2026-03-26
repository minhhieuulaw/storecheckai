import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type { ScrapedData, Verdict, RiskLevel, ReviewConfidence, ScrapedProduct, PriceAnalysis } from "./types";

// OpenAI — vision/price analysis only
let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

// Claude — text/store analysis
let _anthropic: Anthropic | null = null;
function getClaude() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

export interface AIAnalysis {
  verdict: Verdict;
  verdictReason: string;
  returnRisk: RiskLevel;
  returnSummary: string;
  reviewConfidence: ReviewConfidence;
  pros: string[];
  cons: string[];
  complaints: string[];
  redFlags: string[];
  suspiciousSignals: string[];
  whoShouldBuy: string;
  whoShouldAvoid: string;
  finalTake: string;
  trustScoreAdjustment: number;
  translatedReviews: string[];
  nonDeliveryRisk: boolean;
  scamPatterns: string[];
}

const LOCALE_LANGUAGE: Record<string, string> = {
  en: "English", fr: "French", de: "German", es: "Spanish", pt: "Portuguese", it: "Italian",
};

const SYSTEM_PROMPT_BASE = `You are StorecheckAI, a shopping safety analyst for US consumers.
Your job: analyze online store data and give honest, actionable safety assessments.
Rules:
- Be direct and specific. Never vague.
- Never use words: "fake", "scam", "fraud", "fraudulent", "illegal"
- For suspicious patterns use: "unusual patterns", "low-confidence signals", "raises questions"
- trustScoreAdjustment range: -30 to +15. Use negative values aggressively when reviews are poor or suspicious patterns exist. Use -20 to -30 for stores with very bad Trustpilot ratings (below 3.0) combined with complaints about non-delivery or no refunds. Use -10 to -20 for stores with bad reviews (below 3.5) or overpriced products with poor reviews. Use +5 to +15 for genuinely excellent stores with strong positive signals.
- Output ONLY a raw JSON object. No markdown, no code fences, no explanation before or after. Start your response with { and end with }.`;

export async function analyzeWithAI(data: ScrapedData, trustScore: number, returnRiskFromRules: RiskLevel, locale = "en"): Promise<AIAnalysis> {
  const language = LOCALE_LANGUAGE[locale] ?? "English";
  const secHdrs = data.securityHeaders;
  const headerCount = [secHdrs.hsts, secHdrs.xFrameOptions, secHdrs.csp, secHdrs.xContentTypeOptions].filter(Boolean).length;

  const SYSTEM_PROMPT = language === "English"
    ? SYSTEM_PROMPT_BASE
    : `${SYSTEM_PROMPT_BASE}\n- IMPORTANT: Write ALL text values in your JSON response in ${language}. This includes verdictReason, returnSummary, pros, cons, complaints, redFlags, suspiciousSignals, whoShouldBuy, whoShouldAvoid, finalTake, and translatedReviews.`;

  const reviewsExist = data.trustpilotReviews && data.trustpilotReviews.length > 0;

  const prompt = `Analyze this online store for a US shopper and return JSON.

STORE DATA:
- URL: ${data.url}
- Domain: ${data.domain}
- HTTPS: ${data.isHttps ? "Yes" : "No"}
- Security headers: ${headerCount}/4 (HSTS:${secHdrs.hsts}, X-Frame:${secHdrs.xFrameOptions}, CSP:${secHdrs.csp}, X-Content-Type:${secHdrs.xContentTypeOptions})
- Page title: ${data.pageTitle}
- Is Shopify: ${data.isShopify ? "Yes" : "No"}
- Return policy exists: ${data.hasReturnPolicy ? "Yes" : "No"}
- Return policy text: ${data.returnPolicyText ? data.returnPolicyText.slice(0, 600) : "Not found"}
- Shipping policy exists: ${data.hasShippingPolicy ? "Yes" : "No"}
- Shipping policy text: ${data.shippingPolicyText ? data.shippingPolicyText.slice(0, 400) : "Not found"}
- Ships from US: ${data.shipsFromUS === true ? "Yes (US signals detected)" : data.shipsFromUS === false ? "No (overseas signals detected)" : "Unknown"}
- Privacy policy: ${data.hasPrivacyPolicy ? "Yes" : "No"}
- Terms of service: ${data.hasTermsOfService ? "Yes" : "No"}
- Contact page: ${data.hasContactPage ? "Yes" : "No"}
- Contact email: ${data.contactEmail || "None found"}
- Email matches store domain: ${data.emailDomainMatch === true ? "Yes" : data.emailDomainMatch === false ? "No" : "N/A"}
- Phone number: ${data.hasPhoneNumber ? "Yes" : "No"}
- Physical address: ${data.hasAddress ? "Yes" : "No"}
- About page: ${data.hasAboutPage ? `Yes (quality score: ${data.aboutQualityScore}/3)` : "No"}
- Payment methods detected: ${data.paymentMethods.length > 0 ? data.paymentMethods.join(", ") : "None detected"}
- Social links: ${data.socialLinks.length > 0 ? data.socialLinks.join(", ") : "None"}
- Domain age: ${data.domainAgeDays !== null ? `${data.domainAgeDays} days (${(data.domainAgeDays / 365).toFixed(1)} years)` : "Unknown"}
- Trustpilot: ${data.trustpilotRating !== null ? `${data.trustpilotRating.toFixed(1)}/5 (${data.trustpilotReviewCount ?? 0} reviews)` : "Not found"}
${reviewsExist ? `- Trustpilot review snippets:\n${data.trustpilotReviews!.slice(0, 4).map((r, i) => `  ${i + 1}. "${r}"`).join("\n")}` : ""}
- Business registration: ${data.hasBusinessRegistration ? `Yes (${data.businessEntityType})` : "No"}
- On-site review platform: ${data.hasSiteReviews ? data.reviewPlatforms.join(", ") : "None"}
- Cookie consent: ${data.hasCookieConsent ? "Yes" : "No"}
- Manipulation tactics: ${data.manipulationTactics.length > 0 ? data.manipulationTactics.join("; ") : "None detected"}
- Domain redirects: ${data.redirectsToNewDomain ? "Yes — redirects to different domain" : "No"}
- Rule-based trust score: ${trustScore}/100
- Rule-based return risk: ${returnRiskFromRules}
${data.scrapeError ? `- Note: ${data.scrapeError}` : ""}

NON-DELIVERY & PRICING ANALYSIS RULES:
- Scan Trustpilot review snippets for non-delivery signals: "never received", "never arrived", "didn't receive", "no package", "hasn't shown up", "still waiting", "months waiting", "no tracking", "lost package", "where is my order", "no refund", "refused refund", "ghosted", "no response", "disappeared". If 2+ such signals found → set nonDeliveryRisk=true, add specific patterns to scamPatterns[].
- If store has overpriced/marked_up products AND Trustpilot below 3.5 → add "Overpriced products with poor customer ratings" to suspiciousSignals.
- If Trustpilot below 3.0 with 3+ reviews → verdict must be CAUTION or SKIP, never BUY.
- If nonDeliveryRisk=true → verdict must be SKIP, add strong warning to finalTake.

Return ONLY this JSON (no markdown, no explanation):
{
  "verdict": "BUY" | "CAUTION" | "SKIP",
  "verdictReason": "One clear sentence explaining the verdict",
  "returnRisk": "LOW" | "MEDIUM" | "HIGH",
  "returnSummary": "2 sentences about return policy risk in plain English. Be specific about what you found.",
  "reviewConfidence": "LOW" | "MODERATE" | "HIGH" | "UNKNOWN",
  "pros": ["pro1", "pro2", "pro3"],
  "cons": ["con1", "con2", "con3"],
  "complaints": ["Most likely complaint theme 1", "theme 2", "theme 3"],
  "redFlags": ["flag1", "flag2"],
  "suspiciousSignals": ["signal1", "signal2"],
  "whoShouldBuy": "1-2 sentences describing ideal buyer for this store",
  "whoShouldAvoid": "1-2 sentences describing who should avoid this store",
  "finalTake": "2-3 sentences of honest, direct shopping advice",
  "trustScoreAdjustment": 0,
  "nonDeliveryRisk": false,
  "scamPatterns": [],
  "translatedReviews": ${reviewsExist ? `["each Trustpilot snippet translated to ${language}"]` : "[]"}
}`;

  try {
    const response = await getClaude().messages.create({
      model: "claude-sonnet-4-6",
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1200,
    });

    const raw = (response.content[0] as { type: string; text: string })?.text || "{}";
    const parsed = JSON.parse(raw) as AIAnalysis;

    // Sanitize output
    return {
      verdict: (["BUY", "CAUTION", "SKIP"].includes(parsed.verdict) ? parsed.verdict : "CAUTION") as Verdict,
      verdictReason: parsed.verdictReason || "Analysis complete.",
      returnRisk: (["LOW", "MEDIUM", "HIGH"].includes(parsed.returnRisk) ? parsed.returnRisk : returnRiskFromRules) as RiskLevel,
      returnSummary: parsed.returnSummary || "Return policy details unavailable.",
      reviewConfidence: (["LOW", "MODERATE", "HIGH", "UNKNOWN"].includes(parsed.reviewConfidence) ? parsed.reviewConfidence : "UNKNOWN") as ReviewConfidence,
      pros: Array.isArray(parsed.pros) ? parsed.pros.slice(0, 5) : [],
      cons: Array.isArray(parsed.cons) ? parsed.cons.slice(0, 5) : [],
      complaints: Array.isArray(parsed.complaints) ? parsed.complaints.slice(0, 4) : [],
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags.slice(0, 5) : [],
      suspiciousSignals: Array.isArray(parsed.suspiciousSignals) ? parsed.suspiciousSignals.slice(0, 4) : [],
      whoShouldBuy: parsed.whoShouldBuy || "",
      whoShouldAvoid: parsed.whoShouldAvoid || "",
      finalTake: parsed.finalTake || "",
      trustScoreAdjustment: typeof parsed.trustScoreAdjustment === "number" ? Math.max(-30, Math.min(15, parsed.trustScoreAdjustment)) : 0,
      translatedReviews: Array.isArray(parsed.translatedReviews) ? parsed.translatedReviews.slice(0, 4) : [],
      nonDeliveryRisk: parsed.nonDeliveryRisk === true,
      scamPatterns: Array.isArray(parsed.scamPatterns) ? parsed.scamPatterns.slice(0, 5) : [],
    };
  } catch (err) {
    console.error("OpenAI analysis failed:", err);
    // Fallback when AI fails
    return buildFallbackAnalysis(data, trustScore, returnRiskFromRules);
  }
}

function buildFallbackAnalysis(data: ScrapedData, trustScore: number, returnRisk: RiskLevel): AIAnalysis {
  const verdict: Verdict = trustScore >= 65 ? "BUY" : trustScore >= 40 ? "CAUTION" : "SKIP";
  return {
    verdict,
    verdictReason: trustScore >= 65 ? "Store shows solid trust signals." : trustScore >= 40 ? "Store has some trust signals but gaps remain." : "Store is missing too many trust signals.",
    returnRisk,
    returnSummary: data.hasReturnPolicy ? "Return policy exists — review full details before purchasing." : "No return policy found. Consider this a high risk purchase.",
    reviewConfidence: "UNKNOWN",
    pros: data.isHttps ? ["Site uses HTTPS encryption"] : [],
    cons: [
      ...(!data.hasReturnPolicy ? ["No return policy found"] : []),
      ...(!data.hasEmailAddress ? ["No contact email found"] : []),
      ...(!data.hasAddress ? ["No physical address listed"] : []),
    ],
    complaints: [],
    redFlags: [
      ...(!data.isHttps ? ["No HTTPS encryption"] : []),
      ...(!data.hasReturnPolicy ? ["Missing return policy"] : []),
      ...(!data.hasPrivacyPolicy ? ["Missing privacy policy"] : []),
    ],
    suspiciousSignals: [],
    whoShouldBuy: trustScore >= 65 ? "Shoppers looking for a straightforward purchase experience." : "Buyers who have researched this store thoroughly.",
    whoShouldAvoid: trustScore < 50 ? "Anyone uncomfortable with limited store transparency." : "Shoppers needing guaranteed easy returns.",
    finalTake: trustScore >= 65 ? "This store appears legitimate. Proceed with normal caution." : trustScore >= 40 ? "Exercise caution. Verify the store before purchasing." : "Too many trust signals are missing. We recommend looking elsewhere.",
    trustScoreAdjustment: 0,
    translatedReviews: [],
    nonDeliveryRisk: false,
    scamPatterns: [],
  };
}

// ─── GPT-4o Vision price analysis ───────────────────────────────────────────

export async function analyzeProductPrices(products: ScrapedProduct[]): Promise<PriceAnalysis[]> {
  const eligible = products.filter(p => p.image?.startsWith("http") && p.price).slice(0, 4);
  if (eligible.length === 0) return [];

  const results = await Promise.allSettled(
    eligible.map(async (product): Promise<PriceAnalysis | null> => {
      const priceLabel = product.priceUsd != null
        ? `$${product.priceUsd} USD (converted from ${product.price})`
        : product.price!;

      const response = await getOpenAI().chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: product.image!, detail: "low" },
            },
            {
              type: "text",
              text: `Product listed as "${product.name}" on an online store.
Store price: ${priceLabel}

Identify the product from the image and return a price assessment for a US shopper.

Return ONLY this JSON (no markdown):
{
  "isPhysicalProduct": true,
  "identifiedAs": "specific product type you see in the image",
  "amazonPrice": "typical retail price range on Amazon USA, e.g. $20-35, or null if unknown",
  "aliexpressPrice": "typical wholesale/dropship price on AliExpress, e.g. $4-8, or null if unknown",
  "temuPrice": "typical price range on Temu, e.g. $3-7, or null if unknown",
  "markupNote": "markup ratio vs Amazon retail if store price is clearly above it, e.g. '~2x Amazon price', or null",
  "priceVerdict": "cheap" | "fair" | "overpriced" | "marked_up",
  "explanation": "one direct sentence comparing the store price to Amazon retail (primary) and AliExpress/Temu wholesale (reference)"
}

IMPORTANT: Set "isPhysicalProduct" to false if this is clearly a shipping upgrade, expedited delivery, priority processing, protection plan, warranty, insurance, gift wrap, or any non-purchasable service — not a physical product.

Verdict rules:
- "cheap"     = store price is below typical Amazon retail (genuinely good deal)
- "fair"      = store price is within normal Amazon retail range
- "overpriced"= store price is 30–100% above Amazon retail
- "marked_up" = store price is 2x or more above Amazon retail (extreme markup)
- If image is unclear, base on product name only`,
            },
          ],
        }],
        max_tokens: 280,
        response_format: { type: "json_object" },
      });

      const raw = JSON.parse(response.choices[0]?.message?.content || "{}") as {
        isPhysicalProduct?: boolean;
        identifiedAs?: string;
        amazonPrice?: string | null;
        aliexpressPrice?: string | null;
        temuPrice?: string | null;
        markupNote?: string | null;
        priceVerdict?: string;
        explanation?: string;
      };

      // Skip shipping upsells / service items identified by GPT
      if (raw.isPhysicalProduct === false) return null;

      const validVerdicts: PriceAnalysis["priceVerdict"][] = ["fair", "cheap", "overpriced", "marked_up"];
      const verdict = validVerdicts.includes(raw.priceVerdict as PriceAnalysis["priceVerdict"])
        ? raw.priceVerdict as PriceAnalysis["priceVerdict"]
        : "fair";

      const searchTerm = encodeURIComponent(raw.identifiedAs || product.name);
      return {
        productName: product.name,
        storePrice: product.priceUsd != null ? `$${product.priceUsd}` : (product.price ?? "Unknown"),
        identifiedAs: raw.identifiedAs || product.name,
        estimatedMarketPrice: raw.amazonPrice || "Unknown",
        aliexpressPrice: raw.aliexpressPrice || null,
        temuPrice: raw.temuPrice || null,
        markupNote: raw.markupNote || null,
        priceVerdict: verdict,
        explanation: raw.explanation || "",
        imageUrl: product.image,
        googleLensUrl: product.image
          ? `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(product.image)}`
          : null,
        amazonSearchUrl: `https://www.amazon.com/s?k=${searchTerm}`,
        aliexpressSearchUrl: `https://www.aliexpress.com/wholesale?SearchText=${searchTerm}`,
        temuSearchUrl: `https://www.temu.com/search_result.html?search_key=${searchTerm}`,
      };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<PriceAnalysis | null> => r.status === "fulfilled")
    .map(r => r.value)
    .filter((v): v is PriceAnalysis => v !== null);
}
