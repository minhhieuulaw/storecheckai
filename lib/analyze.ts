import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type { ScrapedData, Verdict, RiskLevel, ReviewConfidence, ScrapedProduct, PriceAnalysis } from "./types";
import { VERDICT_THRESHOLDS } from "./scoring";
import { appendAmazonAffiliateTag } from "./affiliate";

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
  reviewSummary: string;
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

const SYSTEM_PROMPT_BASE = `You are StorecheckAI, a shopping safety analyst who talks like a knowledgeable friend — not a corporate robot.
Your job: analyze online store data and give honest, actionable safety assessments that people actually want to read.
Rules:
- Write like you're advising a friend who asked "should I buy from this store?" Be direct, specific, and real.
- Vary your writing style — don't start every field the same way. Mix short punchy sentences with longer explanations.
- Add personality: a touch of humor when appropriate (not forced), relatable comparisons, real talk. But never be mean-spirited or unprofessional.
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

  const goodReviews = data.trustpilotGoodReviews ?? [];
  const badReviews = data.trustpilotBadReviews ?? [];
  const hasStructuredReviews = goodReviews.length > 0 || badReviews.length > 0;
  const reviewsExist = hasStructuredReviews || (data.trustpilotReviews && data.trustpilotReviews.length > 0);

  const formatReview = (r: { author: string; rating: number; date: string; content: string }) =>
    `[${r.rating}★ by ${r.author}, ${r.date}] "${r.content}"`;

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
${hasStructuredReviews ? `- POSITIVE reviews (4-5★):\n${goodReviews.slice(0, 5).map((r, i) => `  ${i + 1}. ${formatReview(r)}`).join("\n")}\n- NEGATIVE reviews (1-3★):\n${badReviews.slice(0, 5).map((r, i) => `  ${i + 1}. ${formatReview(r)}`).join("\n")}` : reviewsExist ? `- Trustpilot review snippets:\n${data.trustpilotReviews!.slice(0, 4).map((r, i) => `  ${i + 1}. "${r}"`).join("\n")}` : ""}
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
  "verdictReason": "One punchy sentence. Talk like you're texting a friend who asked 'should I buy from here?' — e.g. 'Legit brand but their customer service is a dumpster fire right now.'",
  "returnRisk": "LOW" | "MEDIUM" | "HIGH",
  "returnSummary": "2 sentences about return policy. Be conversational and specific — tell them what you actually found, not corporate speak. If the policy has a catch, call it out directly. Example: 'They do have a return policy, which is good news. Bad news? You're paying for return shipping and they take their sweet time — 2-3 weeks for a refund.'",
  "reviewConfidence": "LOW" | "MODERATE" | "HIGH" | "UNKNOWN",
  "pros": ["Write each pro like a friend highlighting the good stuff — specific and real, not generic. Example: '28-year-old domain — this brand has been around longer than most TikTok users have been alive'"],
  "cons": ["Same energy — specific, honest, maybe a touch witty when it fits. Example: 'Customer service apparently took a permanent vacation — multiple reviewers report being ghosted'"],
  "complaints": ["Paraphrase actual customer issues from reviews in a relatable way. Example: 'One customer called to complain about a product and got attitude from a rep named Tina — not exactly the VIP treatment you'd expect at these prices'"],
  "reviewSummary": "Write like a friend giving shopping advice over coffee. 2-3 sentences covering BOTH the good AND the bad. Reference specific customer names when available. Vary your style — sometimes start with the positive, sometimes lead with a warning, sometimes use a metaphor. Examples: 'Okay so here's the deal — the products themselves seem solid, and K Strickland is basically a superfan at this point. BUT... Christina and Larissa both had nightmare experiences with customer service, and the lack of order tracking on a premium brand is giving dollar store energy.' or 'Mixed bag alert: the skincare actually works (several repeat buyers confirm), but good luck if you need help — their support team appears to be running on dial-up.'",
  "redFlags": ["flag1", "flag2"],
  "suspiciousSignals": ["signal1", "signal2"],
  "whoShouldBuy": "1-2 sentences. Be specific and add personality. Example: 'If you already know and love Obagi products from your dermatologist, you'll be fine ordering here. Just... maybe don't plan on calling customer service anytime soon.'",
  "whoShouldAvoid": "1-2 sentences. Reference specific complaints and add a dash of real talk. Example: 'Anyone who values being treated like a human when they call support. Also skip this if you're the type who obsessively tracks packages — you won't find that feature here.'",
  "finalTake": "2-3 sentences of honest, direct shopping advice that reads like a friend's honest opinion. Mix in specific details from reviews. Vary your opening — don't always start with the store name. Examples of good openings: 'Look, here's the bottom line...', 'Real talk:', 'Here's what I'd tell my sister...', 'The short version?'. Make it memorable — this is the last thing they read.",
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
      max_tokens: 3000,
    });

    let raw = (response.content[0] as { type: string; text: string })?.text || "{}";
    // Recover truncated JSON: if response was cut off mid-stream, try to close it
    if (!raw.trimEnd().endsWith("}")) {
      // Find last complete key-value pair and close the object
      const lastBrace = raw.lastIndexOf("}");
      if (lastBrace > 0) raw = raw.slice(0, lastBrace + 1);
      else raw = "{}";
    }
    const parsed = JSON.parse(raw) as AIAnalysis;

    // Sanitize output
    return {
      verdict: (["BUY", "CAUTION", "SKIP"].includes(parsed.verdict) ? parsed.verdict : "CAUTION") as Verdict,
      verdictReason: parsed.verdictReason || "Analysis complete.",
      returnRisk: (["LOW", "MEDIUM", "HIGH"].includes(parsed.returnRisk) ? parsed.returnRisk : returnRiskFromRules) as RiskLevel,
      returnSummary: parsed.returnSummary || "Return policy details unavailable.",
      reviewConfidence: (["LOW", "MODERATE", "HIGH", "UNKNOWN"].includes(parsed.reviewConfidence) ? parsed.reviewConfidence : "UNKNOWN") as ReviewConfidence,
      reviewSummary: parsed.reviewSummary || "",
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
    console.error("Claude analysis failed:", err);
    // Fallback when AI fails
    return buildFallbackAnalysis(data, trustScore, returnRiskFromRules);
  }
}

function buildFallbackAnalysis(data: ScrapedData, trustScore: number, returnRisk: RiskLevel): AIAnalysis {
  const verdict: Verdict = trustScore >= VERDICT_THRESHOLDS.BUY ? "BUY" : trustScore >= VERDICT_THRESHOLDS.CAUTION ? "CAUTION" : "SKIP";
  return {
    verdict,
    verdictReason: trustScore >= 65 ? "Store shows solid trust signals." : trustScore >= 40 ? "Store has some trust signals but gaps remain." : "Store is missing too many trust signals.",
    returnRisk,
    returnSummary: data.hasReturnPolicy ? "Return policy exists — review full details before purchasing." : "No return policy found. Consider this a high risk purchase.",
    reviewConfidence: "UNKNOWN",
    reviewSummary: data.trustpilotReviews?.length ? "Customer reviews exist but AI analysis was unavailable. Read the review snippets below for details." : "No customer reviews available for this store yet.",
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

// ─── Amazon Bestseller Recommendations ──────────────────────────────────────

export interface AmazonRecommendation {
  name: string;
  estimatedPrice: string;
  rating: number;
  reviewCount: string;
  whyBuy: string;
  searchUrl: string;
}

export async function getAmazonRecommendations(
  products: { name: string }[],
  storeDomain: string,
  storeContext?: { pageTitle?: string; ogDescription?: string },
): Promise<AmazonRecommendation[]> {
  // Build context from products OR page content (for funnel/quiz stores without product listings)
  let storeDescription: string;
  if (products.length > 0) {
    storeDescription = `Products on ${storeDomain}: ${products.slice(0, 4).map(p => p.name).join(", ")}`;
  } else if (storeContext?.pageTitle || storeContext?.ogDescription) {
    storeDescription = `Store ${storeDomain} — "${storeContext.pageTitle || ""}" — ${storeContext.ogDescription || ""}`.slice(0, 300);
  } else {
    return []; // No products AND no page context — can't recommend
  }

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: `A shopper is browsing: ${storeDescription}

Find 5-7 REAL popular Amazon bestseller alternatives that are SPECIFICALLY related to the products this store sells.
Only include products that:
- Are actual bestsellers or highly popular on Amazon USA
- Have 4.4+ star rating with substantial review counts (500+ reviews)
- Are from well-known or trusted brands
- Are genuinely similar or related to the store's product category

Return this JSON object (root must be an object with "recommendations" key):
{
  "recommendations": [
    {
      "name": "Full product name as it would appear on Amazon (brand + product name)",
      "estimatedPrice": "$XX.XX",
      "rating": 4.7,
      "reviewCount": "12K+",
      "whyBuy": "One short punchy sentence — why this is a great pick (e.g. 'Amazon's Choice with 50K+ rave reviews' or '#1 best-seller, dermatologist-approved')"
    }
  ]
}

IMPORTANT:
- Use REAL product names that actually exist on Amazon — do not invent products
- Include the brand name (e.g. "Olaplex No.3 Hair Perfector" not just "Hair Perfector")
- Rating must be 4.4 or higher
- reviewCount format: "1.2K+", "50K+", "890+"
- Keep whyBuy under 15 words, make it punchy and compelling
- Products must be genuinely relevant alternatives in the SAME category, not random items
- Vary the price range — include both budget-friendly and premium options`,
      }],
      max_tokens: 700,
      response_format: { type: "json_object" },
    });

    const raw = JSON.parse(response.choices[0]?.message?.content || "{}");
    const items: AmazonRecommendation[] = (Array.isArray(raw) ? raw : raw.recommendations || raw.products || [])
      .filter((item: Record<string, unknown>) =>
        item.name && item.estimatedPrice && typeof item.rating === "number" && item.rating >= 4.4
      )
      .slice(0, 7)
      .map((item: Record<string, unknown>) => {
        const searchTerm = encodeURIComponent(String(item.name));
        const tag = process.env.AMAZON_AFFILIATE_TAG;
        const tagSuffix = tag ? `&tag=${tag}` : "";
        return {
          name: String(item.name).slice(0, 120),
          estimatedPrice: String(item.estimatedPrice),
          rating: Number(item.rating),
          reviewCount: String(item.reviewCount || "500+"),
          whyBuy: String(item.whyBuy || "").slice(0, 100),
          searchUrl: `https://www.amazon.com/s?k=${searchTerm}${tagSuffix}`,
        };
      });

    return items;
  } catch (err) {
    console.error("Amazon recommendations failed:", err);
    return [];
  }
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

Identify the EXACT product from the image and return a price assessment for a US shopper.

Return ONLY this JSON (no markdown):
{
  "isPhysicalProduct": true,
  "identifiedAs": "specific product type/brand/model you see in the image",
  "exactMatch": true or false,
  "amazonPrice": "typical retail price range on Amazon USA for THIS EXACT product or very similar model, e.g. $20-35, or null if unknown",
  "aliexpressPrice": "typical wholesale/dropship price on AliExpress for similar items, e.g. $4-8, or null if unknown",
  "markupNote": "markup ratio vs Amazon ONLY if exactMatch is true, e.g. '~2x Amazon price', or null",
  "priceVerdict": "cheap" | "fair" | "overpriced" | "marked_up",
  "explanation": "one direct sentence — if exactMatch, compare prices directly. If NOT exactMatch, say 'Similar products on Amazon cost $X-Y, but this may be a different model/brand.'"
}

CRITICAL RULES FOR exactMatch:
- Set "exactMatch" to TRUE only if you can confidently identify the SAME product (same brand, model, specs) available on Amazon.
- Set "exactMatch" to FALSE if you can only find SIMILAR products but not the exact same one.
- When exactMatch is FALSE: do NOT set markupNote (set to null). The explanation MUST clarify that the comparison is with similar products, not the exact same item.
- When exactMatch is FALSE: priceVerdict should reflect the general market range, but phrase it cautiously.

IMPORTANT: Set "isPhysicalProduct" to false if this is clearly a shipping upgrade, expedited delivery, priority processing, protection plan, warranty, insurance, gift wrap, or any non-purchasable service.

Verdict rules:
- "cheap"     = store price is below typical Amazon retail for same/similar product
- "fair"      = store price is within normal Amazon retail range for same/similar product
- "overpriced"= store price is 30–100% above Amazon retail (only confident if exactMatch)
- "marked_up" = store price is 2x+ above Amazon retail (ONLY use when exactMatch is true)
- If NOT exactMatch but store price seems high compared to similar products, use "overpriced" with cautious explanation`,
            },
          ],
        }],
        max_tokens: 350,
        response_format: { type: "json_object" },
      });

      const raw = JSON.parse(response.choices[0]?.message?.content || "{}") as {
        isPhysicalProduct?: boolean;
        identifiedAs?: string;
        exactMatch?: boolean;
        amazonPrice?: string | null;
        aliexpressPrice?: string | null;
        markupNote?: string | null;
        priceVerdict?: string;
        explanation?: string;
      };

      // Skip shipping upsells / service items identified by GPT
      if (raw.isPhysicalProduct === false) return null;

      const isExact = raw.exactMatch === true;
      const validVerdicts: PriceAnalysis["priceVerdict"][] = ["fair", "cheap", "overpriced", "marked_up"];
      let verdict = validVerdicts.includes(raw.priceVerdict as PriceAnalysis["priceVerdict"])
        ? raw.priceVerdict as PriceAnalysis["priceVerdict"]
        : "fair";

      // Don't allow "marked_up" verdict when product isn't an exact match
      if (!isExact && verdict === "marked_up") verdict = "overpriced";

      const searchTerm = encodeURIComponent(raw.identifiedAs || product.name);

      return {
        productName: product.name,
        storePrice: product.priceUsd != null ? `$${product.priceUsd}` : (product.price ?? "Unknown"),
        identifiedAs: raw.identifiedAs || product.name,
        exactMatch: isExact,
        estimatedMarketPrice: raw.amazonPrice || "Unknown",
        aliexpressPrice: raw.aliexpressPrice || null,
        // Only show markup note for exact matches
        markupNote: isExact ? (raw.markupNote || null) : null,
        priceVerdict: verdict,
        explanation: raw.explanation || "",
        imageUrl: product.image,
        googleLensUrl: product.image
          ? `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(product.image)}`
          : null,
        amazonSearchUrl: appendAmazonAffiliateTag(`https://www.amazon.com/s?k=${searchTerm}`),
        // AliExpress: search by image via Google Lens redirect (more accurate than keyword)
        aliexpressSearchUrl: product.image
          ? `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(product.image)}&hl=en`
          : `https://www.aliexpress.com/wholesale?SearchText=${searchTerm}`,
      };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<PriceAnalysis | null> => r.status === "fulfilled")
    .map(r => r.value)
    .filter((v): v is PriceAnalysis => v !== null);
}
