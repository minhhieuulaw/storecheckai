/**
 * Amazon Search Scraper + Ranking
 *
 * Scrapes real Amazon search results via curl subprocess (bypasses TLS fingerprinting
 * that blocks Node.js native fetch). Extracts product data (name, price, rating,
 * review count, ASIN, image), filters by quality + price relevance, and ranks them.
 */
import { execFile } from "child_process";
import { promisify } from "util";
import * as cheerio from "cheerio";
import { appendAmazonAffiliateTag } from "./affiliate";
import { pickProxy, reportProxyFailure, reportProxySuccess } from "./proxy-pool";
import { getAmazonMarketplace, type CountryCode } from "./user-country";

const execFileP = promisify(execFile);

// User-Agent pool — rotate to avoid Akamai fingerprinting same identity repeatedly
const UA_POOL = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
];
function pickUserAgent(): string {
  return UA_POOL[Math.floor(Math.random() * UA_POOL.length)];
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ScrapedAmazonProduct {
  name: string;
  price: number | null;
  priceFormatted: string;
  rating: number | null;
  reviewCount: number | null;
  asin: string;
  imageUrl: string | null;
  productUrl: string;
  isPrime: boolean;
  isBestSeller: boolean;
  isSponsored: boolean;
}

// ─── Cache ──────────────────────────────────────────────────────────────────

const amazonSearchCache = new Map<string, { results: ScrapedAmazonProduct[]; expiresAt: number }>();
const AMAZON_CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Cleanup expired cache entries every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of amazonSearchCache) {
    if (now > v.expiresAt) amazonSearchCache.delete(k);
  }
}, 15 * 60 * 1000).unref();

// ─── Scrape Amazon Search ───────────────────────────────────────────────────

function isValidAmazonHtml(html: string): boolean {
  return !!html
    && html.length >= 5000
    && !html.includes("/errors/validateCaptcha")
    && !html.includes("api-services-support@amazon.com");
}

/**
 * Try a single curl request, optionally through a proxy.
 */
async function tryCurlFetch(searchUrl: string, cookieHeader: string, proxyUrl: string | null): Promise<string> {
  const args = [
    "-s",
    "-H", `User-Agent: ${pickUserAgent()}`,
    "-H", "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "-H", "Accept-Language: en-US,en;q=0.9",
    "-H", `Cookie: ${cookieHeader}`,
    "--max-time", "8",
    "--compressed",
  ];
  if (proxyUrl) {
    args.push("--proxy", proxyUrl);
  }
  args.push(searchUrl);

  try {
    const { stdout: html } = await execFileP("curl", args, { maxBuffer: 15 * 1024 * 1024 });
    return html || "";
  } catch {
    return "";
  }
}

/**
 * Fetch Amazon search HTML with tiered strategy:
 *   Tier 1: Direct curl (fastest, free)
 *   Tier 2: Direct retry with UA rotation + backoff
 *   Tier 3: Proxy fallback (if PROXY_POOL configured) — 2 proxy attempts max
 *
 * Returns empty string if all attempts fail.
 */
async function fetchAmazonHtml(searchUrl: string, cookieHeader: string): Promise<string> {
  // Tier 1-2: Direct attempts (2 retries with UA rotation)
  for (let attempt = 1; attempt <= 2; attempt++) {
    const html = await tryCurlFetch(searchUrl, cookieHeader, null);
    if (isValidAmazonHtml(html)) return html;
    if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Tier 3: Proxy fallback — pick random proxies from pool
  for (let attempt = 1; attempt <= 2; attempt++) {
    const proxy = pickProxy();
    if (!proxy) break; // No proxies configured or all blacklisted
    console.log(`[amazon] Retrying via proxy (attempt ${attempt})`);
    const html = await tryCurlFetch(searchUrl, cookieHeader, proxy);
    if (isValidAmazonHtml(html)) {
      reportProxySuccess(proxy);
      return html;
    }
    reportProxyFailure(proxy);
  }

  return "";
}

export async function scrapeAmazonSearch(
  keyword: string,
  maxResults = 15,
  country: CountryCode = "US",
): Promise<ScrapedAmazonProduct[]> {
  // Cache key includes country to prevent mixing data between regions
  const cacheKey = `${country}:${keyword.toLowerCase().trim()}`;
  const cached = amazonSearchCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) return cached.results;

  // Map country → Amazon marketplace (domain, currency, locale, ship-to)
  const marketplace = getAmazonMarketplace(country);
  const searchUrl = `https://${marketplace.domain}/s?k=${encodeURIComponent(keyword)}&s=review-rank&language=${marketplace.locale}`;

  // Cookie setup:
  //   i18n-prefs = currency preference
  //   lc-main    = locale
  //   sp-cdn     = Amazon edge routing (US only — other marketplaces don't need)
  const cookieParts: string[] = [
    `i18n-prefs=${marketplace.currency}`,
    `lc-main=${marketplace.locale}`,
  ];
  if (marketplace.spCdn) cookieParts.push(`sp-cdn="${marketplace.spCdn}"`);
  const cookieHeader = cookieParts.join("; ");

  try {
    // Use curl subprocess with retry + proxy fallback — Node.js fetch triggers
    // Amazon's TLS fingerprinting (503 bot wall) whereas curl's TLS signature
    // is indistinguishable from a normal browser.
    const html = await fetchAmazonHtml(searchUrl, cookieHeader);
    if (!html) {
      console.warn(`Amazon scrape returned empty/blocked response for [${country}]:`, keyword);
      return [];
    }

    const $ = cheerio.load(html);
    const results: ScrapedAmazonProduct[] = [];

    $('[data-component-type="s-search-result"][data-asin]').each((_, el) => {
      if (results.length >= maxResults) return false;

      const $el = $(el);
      const asin = $el.attr("data-asin");
      if (!asin || asin.length < 5) return;

      // Detect sponsored
      const isSponsored = $el.find('[data-component-type="sp-sponsored-result"]').length > 0
        || $el.find(".puis-label-popover-default").text().toLowerCase().includes("sponsored")
        || $el.find(".s-label-popover-default").text().toLowerCase().includes("sponsored");

      // Product name — Amazon uses multiple template variations
      const name = $el.find('h2 a span.a-text-normal').first().text().trim()
        || $el.find('h2 a span').first().text().trim()
        || $el.find('[data-cy="title-recipe"] h2 span').first().text().trim()
        || $el.find('.a-size-base-plus.a-color-base.a-text-normal').first().text().trim()
        || $el.find('span.a-text-normal').first().text().trim()
        || $el.find('h2').first().text().trim();
      if (!name) return;

      // Price
      const priceText = $el.find(".a-price .a-offscreen").first().text().trim();
      const priceMatch = priceText.match(/\$?([\d,]+\.?\d*)/);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(",", "")) : null;
      const priceFormatted = price != null ? `$${price.toFixed(2)}` : priceText || "See price";

      // Rating
      const ratingAttr = $el.find('[aria-label*="out of 5 stars"]').first().attr("aria-label") || "";
      const ratingMatch = ratingAttr.match(/([\d.]+)\s*out of/);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

      // Review count
      const reviewText = $el.find('a[href*="#customerReviews"] span').first().text().trim()
        || $el.find('span[aria-label*="ratings"]').first().text().trim()
        || $el.find('.s-underline-text').first().text().trim();
      const reviewMatch = reviewText.match(/([\d,]+)/);
      const reviewCount = reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, ""), 10) : null;

      // Image
      const imageUrl = $el.find("img.s-image").first().attr("src") || null;

      // Badges
      const badgeText = $el.find(".a-badge-text").text().toLowerCase();
      const isBestSeller = badgeText.includes("best seller");
      const isPrime = $el.find("i.a-icon-prime, [aria-label='Amazon Prime']").length > 0;

      results.push({
        name: name.slice(0, 150),
        price,
        priceFormatted,
        rating,
        reviewCount,
        asin,
        imageUrl,
        // Product URL uses the same marketplace domain as the search — ensures
        // the user lands on the correct regional Amazon store (affiliate tag appended)
        productUrl: appendAmazonAffiliateTag(`https://${marketplace.domain}/dp/${asin}`),
        isPrime,
        isBestSeller,
        isSponsored,
      });
    });

    // Cache results
    amazonSearchCache.set(cacheKey, { results, expiresAt: Date.now() + AMAZON_CACHE_TTL });
    return results;
  } catch (err) {
    console.error("Amazon search scrape failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

// ─── Ranking & Filtering ────────────────────────────────────────────────────

function computeScore(p: ScrapedAmazonProduct, storePrice: number | null): number {
  const ratingScore = p.rating ?? 0;
  const popularityScore = Math.log10((p.reviewCount ?? 0) + 1);
  let priceBoost = 1.0;
  if (storePrice && p.price) {
    const ratio = p.price / storePrice;
    if (ratio >= 0.5 && ratio <= 1.5) priceBoost = 1.3;      // sweet spot — similar price
    else if (ratio >= 0.3 && ratio <= 2.5) priceBoost = 1.0;  // acceptable range
    else priceBoost = 0.5;                                      // too far off
  }
  const bestSellerBoost = p.isBestSeller ? 1.2 : 1.0;
  return ratingScore * popularityScore * priceBoost * bestSellerBoost;
}

export function rankAndFilterAmazonResults(
  products: ScrapedAmazonProduct[],
  storePrice: number | null,
  maxResults = 5,
): ScrapedAmazonProduct[] {
  return products
    .filter(p => !p.isSponsored)
    .filter(p => p.rating != null && p.rating >= 4.0)
    .filter(p => p.reviewCount != null && p.reviewCount >= 50)
    .filter(p => p.price != null && p.price > 0)
    .filter(p => {
      if (!storePrice || !p.price) return true;
      const ratio = p.price / storePrice;
      return ratio >= 0.3 && ratio <= 2.5;
    })
    .sort((a, b) => computeScore(b, storePrice) - computeScore(a, storePrice))
    .slice(0, maxResults);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function formatReviewCount(count: number | null): string {
  if (!count) return "N/A";
  if (count >= 10000) return `${(count / 1000).toFixed(0)}K+`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K+`;
  return `${count}+`;
}

export function generateWhyBuy(p: ScrapedAmazonProduct): string {
  const parts: string[] = [];
  if (p.isBestSeller) parts.push("Best Seller");
  if (p.isPrime) parts.push("Prime");
  if (p.rating && p.rating >= 4.7) parts.push(`${p.rating} stars`);
  if (p.reviewCount && p.reviewCount >= 10000) parts.push(`${formatReviewCount(p.reviewCount)} reviews`);
  else if (p.reviewCount && p.reviewCount >= 1000) parts.push(`${formatReviewCount(p.reviewCount)} reviews`);
  else if (p.reviewCount) parts.push(`${p.reviewCount}+ reviews`);
  if (parts.length === 0) parts.push("Highly rated on Amazon");
  return parts.join(" · ");
}
