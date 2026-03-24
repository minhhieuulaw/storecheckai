import OpenAI from "openai";
import type { ScrapedData, Verdict, RiskLevel, ReviewConfidence, ScrapedProduct, PriceAnalysis } from "./types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
}

const SYSTEM_PROMPT = `You are StorecheckAI, a shopping safety analyst for US consumers.
Your job: analyze online store data and give honest, actionable safety assessments.
Rules:
- Be direct and specific. Never vague.
- Never use words: "fake", "scam", "fraud", "fraudulent", "illegal"
- For suspicious patterns use: "unusual patterns", "low-confidence signals", "raises questions"
- Always output valid JSON — nothing else, no markdown.`;

export async function analyzeWithAI(data: ScrapedData, trustScore: number, returnRiskFromRules: RiskLevel): Promise<AIAnalysis> {
  const secHdrs = data.securityHeaders;
  const headerCount = [secHdrs.hsts, secHdrs.xFrameOptions, secHdrs.csp, secHdrs.xContentTypeOptions].filter(Boolean).length;

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
- Business registration: ${data.hasBusinessRegistration ? `Yes (${data.businessEntityType})` : "No"}
- On-site review platform: ${data.hasSiteReviews ? data.reviewPlatforms.join(", ") : "None"}
- Cookie consent: ${data.hasCookieConsent ? "Yes" : "No"}
- Manipulation tactics: ${data.manipulationTactics.length > 0 ? data.manipulationTactics.join("; ") : "None detected"}
- Domain redirects: ${data.redirectsToNewDomain ? "Yes — redirects to different domain" : "No"}
- Rule-based trust score: ${trustScore}/100
- Rule-based return risk: ${returnRiskFromRules}
${data.scrapeError ? `- Note: ${data.scrapeError}` : ""}

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
  "trustScoreAdjustment": 0
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content || "{}";
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
      trustScoreAdjustment: typeof parsed.trustScoreAdjustment === "number" ? Math.max(-10, Math.min(10, parsed.trustScoreAdjustment)) : 0,
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
  };
}

// ─── GPT-4o Vision price analysis ───────────────────────────────────────────

export async function analyzeProductPrices(products: ScrapedProduct[]): Promise<PriceAnalysis[]> {
  const eligible = products.filter(p => p.image?.startsWith("http") && p.price).slice(0, 4);
  if (eligible.length === 0) return [];

  const results = await Promise.allSettled(
    eligible.map(async (product): Promise<PriceAnalysis> => {
      const priceLabel = product.priceUsd != null
        ? `$${product.priceUsd} USD (converted from ${product.price})`
        : product.price!;

      const response = await openai.chat.completions.create({
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
  "identifiedAs": "specific product type you see in the image",
  "amazonPrice": "typical retail price range on Amazon USA, e.g. $20-35, or null if unknown",
  "aliexpressPrice": "typical wholesale/dropship price on AliExpress, e.g. $4-8, or null if unknown",
  "markupNote": "markup ratio vs AliExpress if clearly identifiable, e.g. '~4x AliExpress price', or null",
  "priceVerdict": "cheap" | "fair" | "overpriced" | "marked_up",
  "explanation": "one direct sentence comparing the store price to the Amazon retail and AliExpress wholesale prices"
}

Verdict rules:
- "cheap"     = store price is below typical Amazon retail (genuinely good deal)
- "fair"      = store price is within normal Amazon retail range
- "overpriced"= store price is 30–100% above Amazon retail but no extreme markup
- "marked_up" = store price is 2x or more above AliExpress wholesale (classic dropshipping margin)
- If image is unclear, base on product name only`,
            },
          ],
        }],
        max_tokens: 250,
        response_format: { type: "json_object" },
      });

      const raw = JSON.parse(response.choices[0]?.message?.content || "{}") as {
        identifiedAs?: string;
        amazonPrice?: string | null;
        aliexpressPrice?: string | null;
        markupNote?: string | null;
        priceVerdict?: string;
        explanation?: string;
      };

      const validVerdicts: PriceAnalysis["priceVerdict"][] = ["fair", "cheap", "overpriced", "marked_up"];
      const verdict = validVerdicts.includes(raw.priceVerdict as PriceAnalysis["priceVerdict"])
        ? raw.priceVerdict as PriceAnalysis["priceVerdict"]
        : "fair";

      return {
        productName: product.name,
        storePrice: product.priceUsd != null ? `$${product.priceUsd}` : (product.price ?? "Unknown"),
        identifiedAs: raw.identifiedAs || product.name,
        estimatedMarketPrice: raw.amazonPrice || "Unknown",
        aliexpressPrice: raw.aliexpressPrice || null,
        markupNote: raw.markupNote || null,
        priceVerdict: verdict,
        explanation: raw.explanation || "",
        imageUrl: product.image,
        googleLensUrl: product.image
          ? `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(product.image)}`
          : null,
        amazonSearchUrl: `https://www.amazon.com/s?k=${encodeURIComponent(raw.identifiedAs || product.name)}`,
        aliexpressSearchUrl: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(raw.identifiedAs || product.name)}`,
      };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<PriceAnalysis> => r.status === "fulfilled")
    .map(r => r.value);
}
