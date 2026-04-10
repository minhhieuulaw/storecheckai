/**
 * AliExpress Product Search + Ranking
 *
 * Uses AliExpress Open Platform API (aliexpress.affiliate.product.query) to fetch
 * real products with affiliate links already attached. Replaces curl scraping which
 * was unreliable from VPS IPs (Akamai captcha) and through HTTP proxies (502 tunnel).
 *
 * API benefits over scraping:
 *  - 100% reliable from any IP (API endpoint api-sg.aliexpress.com not blocked)
 *  - Affiliate links (s.click.aliexpress.com/e/_XXX) returned directly — no extra API call
 *  - Commission rate available per product
 *  - Structured JSON — no regex parsing fragility
 */
import { queryAffiliateProducts, generateAffiliateLinks, type AliApiProduct } from "./aliexpress-api";
import { appendAliExpressAffiliateTag } from "./affiliate";
import { getAliExpressConfig, type CountryCode } from "./user-country";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ScrapedAliProduct {
  productId: string;
  title: string;
  price: number | null;            // numeric USD
  priceFormatted: string;
  rating: number | null;           // 0-5
  ordersText: string;              // "50,000+ sold"
  ordersCount: number;             // parsed for ranking
  imageUrl: string | null;
  productUrl: string;              // s.click.aliexpress.com/e/_XXX (affiliate tracked)
  commissionRate: string;          // "7.0%"
}

// ─── Cache ──────────────────────────────────────────────────────────────────

const aliSearchCache = new Map<string, { results: ScrapedAliProduct[]; expiresAt: number }>();
const ALI_CACHE_TTL = 60 * 60 * 1000; // 1 hour

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of aliSearchCache) {
    if (now > v.expiresAt) aliSearchCache.delete(k);
  }
}, 15 * 60 * 1000).unref();

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Parse evaluate_rate ("4.9" or "94.5%") → star rating 0-5.
 * AliExpress returns eval_rate as percentage (0-100) or direct (0-5).
 */
function parseRating(raw: string): number | null {
  if (!raw) return null;
  const num = parseFloat(raw.replace("%", ""));
  if (isNaN(num)) return null;
  if (num > 5) return Math.round((num / 20) * 10) / 10; // percentage → 0-5
  return num;
}

/**
 * Format orders count: 50000 → "50,000+ sold", 1234 → "1,000+ sold"
 */
function formatOrders(count: number): string {
  if (count >= 100000) return `${Math.floor(count / 10000) * 10},000+ sold`;
  if (count >= 10000) return `${Math.floor(count / 10000) * 10},000+ sold`;
  if (count >= 1000) return `${Math.floor(count / 1000)},000+ sold`;
  if (count >= 100) return `${Math.floor(count / 100) * 100}+ sold`;
  return `${count} sold`;
}

function apiProductToScraped(p: AliApiProduct, trackedUrl: string): ScrapedAliProduct {
  return {
    productId: p.productId,
    title: p.title,
    price: p.salePriceUsd,
    priceFormatted: `$${p.salePriceUsd.toFixed(2)}`,
    rating: parseRating(p.evaluateRate),
    ordersText: formatOrders(p.lastestVolume),
    ordersCount: p.lastestVolume,
    imageUrl: p.imageUrl,
    productUrl: trackedUrl,
    commissionRate: p.commissionRate,
  };
}

// ─── Search via API ─────────────────────────────────────────────────────────

export async function scrapeAliSearch(
  keyword: string,
  maxResults = 15,
  country: CountryCode = "US",
): Promise<ScrapedAliProduct[]> {
  // Cache key includes country
  const cacheKey = `${country}:${keyword.toLowerCase().trim()}`;
  const cached = aliSearchCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) return cached.results;

  const aliConfig = getAliExpressConfig(country);

  try {
    const apiProducts = await queryAffiliateProducts(keyword, {
      pageSize: maxResults,
      pageNo: 1,
      sort: "LAST_VOLUME_DESC", // best selling first
      targetCurrency: aliConfig.currency,
      targetLanguage: "EN",
      shipToCountry: country,
    });

    if (apiProducts.length === 0) {
      aliSearchCache.set(cacheKey, { results: [], expiresAt: Date.now() + ALI_CACHE_TTL });
      return [];
    }

    // Batch-convert productDetailUrl → per-product affiliate short links via link.generate.
    // The product.query API returns a single generic promotion_link shared across all products,
    // which lands on a category page not the specific product. link.generate returns proper
    // per-product s.click.aliexpress.com/e/_XXX short links that redirect to the exact item.
    const rawUrls = apiProducts.map(p => p.productDetailUrl).filter(u => u && u.length > 0);
    let linkMap = new Map<string, string>();
    try {
      linkMap = await generateAffiliateLinks(rawUrls);
    } catch (err) {
      console.warn("[aliexpress] link.generate failed, using manual tag fallback:", err instanceof Error ? err.message : err);
    }

    const results = apiProducts.map(p => {
      const wrappedUrl = linkMap.get(p.productDetailUrl)
        || appendAliExpressAffiliateTag(p.productDetailUrl);
      return apiProductToScraped(p, wrappedUrl);
    });

    aliSearchCache.set(cacheKey, { results, expiresAt: Date.now() + ALI_CACHE_TTL });
    return results;
  } catch (err) {
    console.error("AliExpress API query failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

// ─── Ranking & Filtering ────────────────────────────────────────────────────

function computeAliScore(p: ScrapedAliProduct, storePrice: number | null): number {
  const ratingScore = p.rating ?? 3.0;
  const popularityScore = Math.log10(p.ordersCount + 1);
  let priceBoost = 1.0;
  if (storePrice && p.price) {
    const ratio = p.price / storePrice;
    if (ratio <= 0.8) priceBoost = 1.5;  // much cheaper = strongly preferred
    else if (ratio <= 1.2) priceBoost = 1.2;  // similar price
    else if (ratio <= 2.0) priceBoost = 0.8;  // slightly overpriced
    else priceBoost = 0.3;                     // too expensive
  }
  return ratingScore * popularityScore * priceBoost;
}

export function rankAndFilterAliResults(
  products: ScrapedAliProduct[],
  storePrice: number | null,
  maxResults = 5,
): ScrapedAliProduct[] {
  return products
    .filter(p => p.price != null && p.price > 0)
    .filter(p => p.ordersCount >= 100)            // at least 100 sales (proves legitimacy)
    .filter(p => p.rating == null || p.rating >= 3.5)
    .filter(p => {
      if (!storePrice || !p.price) return true;
      const ratio = p.price / storePrice;
      return ratio >= 0.1 && ratio <= 3.0;       // AliExpress usually cheaper, allow wider range
    })
    .sort((a, b) => computeAliScore(b, storePrice) - computeAliScore(a, storePrice))
    .slice(0, maxResults);
}
