/**
 * AliExpress Search Scraper + Ranking
 *
 * Scrapes real AliExpress search results via curl subprocess. AliExpress embeds
 * product data as JSON inside window._dida_config_/window.runParams, so we extract
 * fields via targeted regex per productId (cheerio can't parse dynamic JS state).
 */
import { execFile } from "child_process";
import { promisify } from "util";
import { generateAffiliateLinks } from "./aliexpress-api";
import { appendAliExpressAffiliateTag } from "./affiliate";
import { pickProxy, reportProxyFailure, reportProxySuccess } from "./proxy-pool";
import { getAliExpressConfig, type CountryCode } from "./user-country";

const execFileP = promisify(execFile);

// User-Agent pool — rotate to avoid fingerprinting
const UA_POOL = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];
function pickUserAgent(): string {
  return UA_POOL[Math.floor(Math.random() * UA_POOL.length)];
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ScrapedAliProduct {
  productId: string;
  title: string;
  price: number | null;            // numeric USD
  priceFormatted: string;
  rating: number | null;           // 0-5
  ordersText: string;              // "50,000+ sold"
  ordersCount: number;             // parsed numeric for ranking
  imageUrl: string | null;
  productUrl: string;
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

function parseOrdersCount(text: string): number {
  // "50,000+ sold" → 50000, "2,000+ sold" → 2000, "100+ sold" → 100
  const m = text.match(/([\d,]+)/);
  if (!m) return 0;
  return parseInt(m[1].replace(/,/g, ""), 10) || 0;
}

function unescapeJsonString(s: string): string {
  return s
    .replace(/\\u002F/g, "/")
    .replace(/\\u0026/g, "&")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

// ─── Scrape AliExpress Search ───────────────────────────────────────────────

function isValidAliHtml(html: string): boolean {
  if (!html || html.length < 5000) return false;
  // Captcha/punish page detection
  if (html.includes("_____tmd_____/punish") || html.includes('"action":"captcha"') || html.includes("nc_1_wrapper")) return false;
  return true;
}

async function tryAliFetch(searchUrl: string, cookieHeader: string, proxyUrl: string | null): Promise<string> {
  const args = [
    "-s",
    "-H", `User-Agent: ${pickUserAgent()}`,
    "-H", "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "-H", "Accept-Language: en-US,en;q=0.9",
    "-H", `Cookie: ${cookieHeader}`,
    "--max-time", "8",
    "--compressed",
  ];
  if (proxyUrl) args.push("--proxy", proxyUrl);
  args.push(searchUrl);

  try {
    const { stdout: html } = await execFileP("curl", args, { maxBuffer: 15 * 1024 * 1024 });
    return html || "";
  } catch {
    return "";
  }
}

/**
 * Fetch with tiered retry: direct → direct retry → proxy fallback.
 */
async function fetchAliHtml(searchUrl: string, cookieHeader: string): Promise<string> {
  // Tier 1-2: Direct attempts
  for (let attempt = 1; attempt <= 2; attempt++) {
    const html = await tryAliFetch(searchUrl, cookieHeader, null);
    if (isValidAliHtml(html)) return html;
    if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Tier 3: Proxy fallback
  for (let attempt = 1; attempt <= 2; attempt++) {
    const proxy = pickProxy();
    if (!proxy) break;
    console.log(`[aliexpress] Retrying via proxy (attempt ${attempt})`);
    const html = await tryAliFetch(searchUrl, cookieHeader, proxy);
    if (isValidAliHtml(html)) {
      reportProxySuccess(proxy);
      return html;
    }
    reportProxyFailure(proxy);
  }

  return "";
}

export async function scrapeAliSearch(
  keyword: string,
  maxResults = 15,
  country: CountryCode = "US",
): Promise<ScrapedAliProduct[]> {
  // Cache key includes country to prevent mixing regional data
  const cacheKey = `${country}:${keyword.toLowerCase().trim()}`;
  const cached = aliSearchCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) return cached.results;

  const aliConfig = getAliExpressConfig(country);

  // SortType=total_tranpro_desc = sort by orders count (best selling first)
  // aep_usuc_f cookie drives region/currency/locale
  const searchUrl = `https://www.aliexpress.com/w/wholesale-${encodeURIComponent(keyword)}.html?SortType=total_tranpro_desc`;
  const cookieHeader = `aep_usuc_f=site=glo&c_tp=${aliConfig.currency}&x_alimid=0&region=${aliConfig.region}&b_locale=${aliConfig.locale}`;

  try {
    const html = await fetchAliHtml(searchUrl, cookieHeader);
    if (!html) {
      console.warn(`AliExpress scrape returned empty/blocked for [${country}]:`, keyword);
      return [];
    }

    // Parse embedded JSON: AliExpress puts product list in window.runParams._dida_config_
    // Each product has structure: "productId":"...","image":{"imgUrl":"..."},"title":{"displayTitle":"..."},
    //   "prices":{...,"salePrice":{"minPrice":X,"currencyCode":"USD","formattedPrice":"US $X.XX"}},
    //   "evaluation":{"starRating":X},"trade":{"tradeDesc":"N+ sold"}
    const productIds = new Set<string>();
    const pidRegex = /"productId":"(\d{10,})"/g;
    let m: RegExpExecArray | null;
    while ((m = pidRegex.exec(html)) !== null) {
      productIds.add(m[1]);
      if (productIds.size >= maxResults * 2) break;
    }

    const results: ScrapedAliProduct[] = [];
    for (const pid of productIds) {
      if (results.length >= maxResults) break;
      const pidIdx = html.indexOf(`"productId":"${pid}"`);
      if (pidIdx === -1) continue;
      // Window of 3000 chars after productId for context
      const ctx = html.slice(pidIdx, pidIdx + 3000);

      const titleMatch = ctx.match(/"displayTitle":"([^"\\]+(?:\\.[^"\\]*)*)"/);
      const priceFormattedMatch = ctx.match(/"salePrice":\{[^}]*"formattedPrice":"([^"]+)"/);
      const priceMinMatch = ctx.match(/"salePrice":\{[^}]*"minPrice":([\d.]+)/);
      const currencyMatch = ctx.match(/"salePrice":\{[^}]*"currencyCode":"([A-Z]{3})"/);
      const imageMatch = ctx.match(/"imgUrl":"([^"]+)"/);
      const ratingMatch = ctx.match(/"starRating":([\d.]+)/);
      const ordersMatch = ctx.match(/"tradeDesc":"([^"]+)"/);

      if (!titleMatch || !imageMatch) continue;

      // AliExpress quirk: minPrice is sometimes integer VND but formattedPrice shows USD
      // Trust formattedPrice string and parse USD from it
      const priceFormatted = priceFormattedMatch?.[1] ?? "";
      const usdMatch = priceFormatted.match(/\$\s*([\d,]+\.?\d*)/);
      const priceUsd = usdMatch ? parseFloat(usdMatch[1].replace(/,/g, "")) : null;

      // Only keep USD-currency results
      if (currencyMatch && currencyMatch[1] !== "USD") continue;
      if (priceUsd === null || priceUsd <= 0) continue;

      const ordersText = ordersMatch?.[1] ?? "";
      const ordersCount = parseOrdersCount(ordersText);

      let imgUrl = imageMatch[1];
      if (imgUrl.startsWith("//")) imgUrl = "https:" + imgUrl;

      results.push({
        productId: pid,
        title: unescapeJsonString(titleMatch[1]).slice(0, 120),
        price: priceUsd,
        priceFormatted: priceFormatted || `$${priceUsd.toFixed(2)}`,
        rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
        ordersText,
        ordersCount,
        imageUrl: imgUrl,
        productUrl: `https://www.aliexpress.com/item/${pid}.html`,
      });
    }

    // Wrap all productUrls through affiliate tracking.
    // Prefer official API (short links like s.click.aliexpress.com/e/_XXX — tracked commission)
    // Fall back to manual URL param wrap if API fails.
    if (results.length > 0) {
      try {
        const rawUrls = results.map(r => r.productUrl);
        const affiliateMap = await generateAffiliateLinks(rawUrls);
        for (const r of results) {
          const wrapped = affiliateMap.get(r.productUrl);
          r.productUrl = wrapped || appendAliExpressAffiliateTag(r.productUrl);
        }
      } catch (err) {
        console.warn("AliExpress affiliate wrap failed, using manual tag:", err);
        for (const r of results) {
          r.productUrl = appendAliExpressAffiliateTag(r.productUrl);
        }
      }
    }

    aliSearchCache.set(cacheKey, { results, expiresAt: Date.now() + ALI_CACHE_TTL });
    return results;
  } catch (err) {
    console.error("AliExpress scrape failed:", err instanceof Error ? err.message : err);
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
    .filter(p => p.ordersCount >= 100)           // at least 100 sales (proves legitimacy)
    .filter(p => p.rating == null || p.rating >= 3.5)  // allow null (new products) but reject bad
    .filter(p => {
      if (!storePrice || !p.price) return true;
      const ratio = p.price / storePrice;
      return ratio >= 0.1 && ratio <= 2.5;  // AliExpress is usually cheaper, allow wider lower range
    })
    .sort((a, b) => computeAliScore(b, storePrice) - computeAliScore(a, storePrice))
    .slice(0, maxResults);
}
