/**
 * Dropship Risk Detection (US market)
 *
 * Analyzes the price gap between the store and AliExpress/Amazon to detect
 * likely dropshipping with inflated markup. Also estimates landed cost for US buyers.
 */
import type { AliExpressRecommendation, AmazonRecommendation } from "./analyze";
import type { DeepProductIntel, ScrapedData } from "./types";
import { getCountryName, type CountryCode } from "./user-country";

export interface DropshipRiskResult {
  markupScore: number;             // 0-100
  level: "low" | "medium" | "high" | "critical";
  storePriceUsd: number | null;
  aliMedianPriceUsd: number | null;
  markupMultiplier: number | null;
  evidence: string[];
  recommendation: string;
}

export interface LandedCostEstimate {
  productPriceUsd: number;
  estimatedShippingUsd: number;
  estimatedDutyUsd: number;
  totalUsd: number;
  shippingTimeText: string;
  afterSalesRisk: "low" | "medium" | "high";
  note: string;
}

/**
 * Compute dropship risk based on price gap vs. AliExpress + product genericity signals.
 *
 * Signals combined:
 *   - markupMultiplier = storePrice / median(AliExpress top 5 prices)
 *   - productGenericity: true if intel.productName matches generic pattern
 *   - domainAge: new domains (<90 days) amplify risk
 *   - aliOrdersVolume: if top AliExpress result has 10K+ orders, strong genericity signal
 */
export function detectDropshipRisk(
  intel: DeepProductIntel | null | undefined,
  aliRecs: AliExpressRecommendation[],
  amazonRecs: AmazonRecommendation[],
  scraped: Pick<ScrapedData, "domainAgeDays">,
): DropshipRiskResult | null {
  const storePriceUsd = intel?.currentPrice ?? null;
  if (storePriceUsd == null || storePriceUsd <= 0) return null;

  // Compute AliExpress median price from top 5 results
  const aliPrices = aliRecs
    .slice(0, 5)
    .map(r => r.priceNumeric)
    .filter((p): p is number => typeof p === "number" && p > 0)
    .sort((a, b) => a - b);

  if (aliPrices.length === 0) {
    // No AliExpress data — cannot compute dropship risk reliably
    return null;
  }

  const aliMedianPriceUsd = aliPrices[Math.floor(aliPrices.length / 2)];
  const markupMultiplier = storePriceUsd / aliMedianPriceUsd;

  // Product genericity: AliExpress top product has >10K orders = very generic OEM product
  const topAliOrders = aliRecs[0]?.ordersText ?? "";
  const hasHighOrderVolume = /(\d+,?\d*)K\+|10,000\+|50,000\+|100,000\+/i.test(topAliOrders);

  // Compute base markup score
  let score = 0;
  if (markupMultiplier >= 5) score += 70;          // 5x+ markup — almost certain dropship
  else if (markupMultiplier >= 3) score += 55;     // 3-5x — very likely dropship
  else if (markupMultiplier >= 2) score += 40;     // 2-3x — likely dropship
  else if (markupMultiplier >= 1.5) score += 25;   // 1.5-2x — possible markup
  else score += 5;                                  // <1.5x — normal retail markup

  if (hasHighOrderVolume) score += 15;             // generic OEM product (whitelabel)
  if (scraped.domainAgeDays != null && scraped.domainAgeDays < 90) score += 15;  // brand new store
  else if (scraped.domainAgeDays != null && scraped.domainAgeDays < 180) score += 8;

  // Check Amazon has same product cheaper = further evidence
  const amazonMedianPrice = amazonRecs
    .slice(0, 5)
    .map(r => {
      const m = r.estimatedPrice.match(/\$?([\d,.]+)/);
      return m ? parseFloat(m[1].replace(/,/g, "")) : null;
    })
    .filter((p): p is number => typeof p === "number" && p > 0)
    .sort((a, b) => a - b);
  const amazonMedian = amazonMedianPrice[Math.floor(amazonMedianPrice.length / 2)];
  if (amazonMedian && storePriceUsd > amazonMedian * 1.3) score += 10;

  score = Math.min(100, Math.max(0, Math.round(score)));

  // Determine level from score
  let level: DropshipRiskResult["level"];
  if (score >= 75) level = "critical";
  else if (score >= 55) level = "high";
  else if (score >= 30) level = "medium";
  else level = "low";

  // Build evidence list
  const evidence: string[] = [];
  evidence.push(
    `Store charges $${storePriceUsd.toFixed(2)}, while similar products on AliExpress median at $${aliMedianPriceUsd.toFixed(2)} (${markupMultiplier.toFixed(1)}× markup).`,
  );
  if (hasHighOrderVolume) {
    evidence.push(
      `Top AliExpress seller has ${topAliOrders} — this is a generic OEM product, not a unique brand.`,
    );
  }
  if (scraped.domainAgeDays != null && scraped.domainAgeDays < 90) {
    evidence.push(
      `Store domain is only ${scraped.domainAgeDays} days old — typical dropship stores are recently registered.`,
    );
  }
  if (amazonMedian && storePriceUsd > amazonMedian * 1.3) {
    evidence.push(
      `Amazon has similar products around $${amazonMedian.toFixed(2)} with Prime shipping and easy returns.`,
    );
  }
  const cheapestAli = aliPrices[0];
  if (cheapestAli && cheapestAli < storePriceUsd * 0.3) {
    const saving = storePriceUsd - cheapestAli;
    evidence.push(
      `You could save up to $${saving.toFixed(2)} (${Math.round((saving / storePriceUsd) * 100)}%) buying directly from AliExpress.`,
    );
  }

  // Recommendation based on level
  let recommendation: string;
  switch (level) {
    case "critical":
      recommendation =
        `Avoid this store. The markup is excessive and the product is widely available on Amazon (with Prime shipping + returns) or directly on AliExpress for a fraction of the price.`;
      break;
    case "high":
      recommendation =
        `Think twice. This looks like a dropshipping store with ${markupMultiplier.toFixed(1)}× markup. Consider buying from Amazon for faster shipping and easy returns, or AliExpress to save money if you can wait.`;
      break;
    case "medium":
      recommendation =
        `Compare options before buying. The store has noticeable markup. Amazon likely has the same product with Prime shipping, and AliExpress has it cheaper if you're patient.`;
      break;
    case "low":
      recommendation =
        `Price looks reasonable compared to alternatives. Still verify shipping terms and return policy before checkout.`;
      break;
  }

  return {
    markupScore: score,
    level,
    storePriceUsd,
    aliMedianPriceUsd,
    markupMultiplier: Math.round(markupMultiplier * 10) / 10,
    evidence,
    recommendation,
  };
}

// Country-specific import duty thresholds (de minimis) and typical duty rates
// Source: customs authorities (approximate, subject to change)
const DUTY_RULES: Record<string, { deMinimis: number; typicalRate: number; currency: string }> = {
  US: { deMinimis: 800, typicalRate: 0.05, currency: "USD" },  // US $800 de minimis
  GB: { deMinimis: 135, typicalRate: 0.20, currency: "GBP" },  // UK £135, VAT 20%
  DE: { deMinimis: 150, typicalRate: 0.19, currency: "EUR" },  // EU €150, VAT 19%
  FR: { deMinimis: 150, typicalRate: 0.20, currency: "EUR" },  // EU €150, VAT 20%
  IT: { deMinimis: 150, typicalRate: 0.22, currency: "EUR" },
  ES: { deMinimis: 150, typicalRate: 0.21, currency: "EUR" },
  NL: { deMinimis: 150, typicalRate: 0.21, currency: "EUR" },
  CA: { deMinimis: 20,  typicalRate: 0.13, currency: "CAD" },  // CAD $20, GST 13%
  AU: { deMinimis: 1000, typicalRate: 0.10, currency: "AUD" }, // AUD $1000, GST 10%
  JP: { deMinimis: 66,  typicalRate: 0.10, currency: "USD" },  // Japan ¥10,000 ≈ $66
  VN: { deMinimis: 44,  typicalRate: 0.10, currency: "USD" },  // Vietnam 1M VND ≈ $44
  TH: { deMinimis: 45,  typicalRate: 0.07, currency: "USD" },
  SG: { deMinimis: 300, typicalRate: 0.09, currency: "SGD" },
  IN: { deMinimis: 0,   typicalRate: 0.18, currency: "INR" },  // India no de minimis, GST 18%
  MX: { deMinimis: 50,  typicalRate: 0.16, currency: "USD" },
  BR: { deMinimis: 50,  typicalRate: 0.60, currency: "USD" },  // Brazil import tax up to 60%
};

/**
 * Estimate landed cost for a buyer in any country: product + shipping + import duty.
 * Handles de minimis thresholds (below which no duty is charged) per country.
 */
export function estimateLandedCost(
  intel: DeepProductIntel | null | undefined,
  scraped: Pick<ScrapedData, "shippingOriginSignals" | "shipsFromUS" | "hasReturnPolicy">,
  country: CountryCode = "US",
): LandedCostEstimate | null {
  const productPriceUsd = intel?.currentPrice ?? null;
  if (productPriceUsd == null || productPriceUsd <= 0) return null;

  const countryName = getCountryName(country);
  const dutyRules = DUTY_RULES[country] ?? DUTY_RULES.US;

  // Detect if store ships from US or overseas
  const shipsFromUs = scraped.shipsFromUS === true;
  const overseasSignals = scraped.shippingOriginSignals?.some(s =>
    /china|cn|hongkong|hk|asia|overseas/i.test(s)
  );

  // Estimate shipping cost + time based on buyer country and store origin
  let estimatedShippingUsd = 0;
  let shippingTimeText = "Shipping time unclear";
  const isDomestic = (country === "US" && shipsFromUs);

  if (isDomestic) {
    estimatedShippingUsd = 0;
    shippingTimeText = "3-7 business days (domestic)";
  } else if (shipsFromUs && country !== "US") {
    // Ships from US to other country — international
    estimatedShippingUsd = 0; // dropship stores usually hide shipping in product price
    shippingTimeText = "1-3 weeks (international from US)";
  } else if (overseasSignals) {
    estimatedShippingUsd = 0;
    shippingTimeText = "2-4 weeks (international)";
  }

  // Import duty: only applies if product price > de minimis for the buyer's country
  const estimatedDutyUsd = productPriceUsd > dutyRules.deMinimis
    ? productPriceUsd * dutyRules.typicalRate
    : 0;

  const totalUsd = productPriceUsd + estimatedShippingUsd + estimatedDutyUsd;

  // After-sales risk: overseas + no return policy = high
  let afterSalesRisk: LandedCostEstimate["afterSalesRisk"];
  if (!scraped.hasReturnPolicy) {
    afterSalesRisk = "high";
  } else if (overseasSignals && !isDomestic) {
    afterSalesRisk = "high";
  } else if (!isDomestic) {
    afterSalesRisk = "medium";
  } else {
    afterSalesRisk = "low";
  }

  // Build country-specific note
  let note: string;
  if (afterSalesRisk === "high") {
    note = `If the product is defective, returning it from ${countryName} overseas (at your cost) can exceed the purchase price. Amazon purchases are protected by Prime return policy.`;
  } else if (afterSalesRisk === "medium") {
    note = `Returns may require international shipping back to the seller. Check the store's return policy carefully before ordering to ${countryName}.`;
  } else {
    note = `Domestic shipping and returns likely within ${countryName} — confirm with store policy.`;
  }

  // Add duty note if applicable
  if (estimatedDutyUsd > 0) {
    note += ` Import duty/VAT (~${Math.round(dutyRules.typicalRate * 100)}%) may apply as the order exceeds ${countryName}'s de minimis threshold.`;
  }

  return {
    productPriceUsd,
    estimatedShippingUsd,
    estimatedDutyUsd,
    totalUsd,
    shippingTimeText,
    afterSalesRisk,
    note,
  };
}

/** @deprecated Use estimateLandedCost(intel, scraped, "US") instead */
export function estimateLandedCostUs(
  intel: DeepProductIntel | null | undefined,
  scraped: Pick<ScrapedData, "shippingOriginSignals" | "shipsFromUS" | "hasReturnPolicy">,
): LandedCostEstimate | null {
  return estimateLandedCost(intel, scraped, "US");
}
