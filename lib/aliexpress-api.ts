/**
 * AliExpress Open Platform API Client
 *
 * Handles signed API calls to the AliExpress affiliate API (TOP-style protocol).
 * Uses HMAC-SHA256 signing with the standard TOP signing algorithm.
 *
 * Required env vars:
 *   ALIEXPRESS_APP_KEY     — public app identifier
 *   ALIEXPRESS_APP_SECRET  — private HMAC secret (server-side only, NEVER expose)
 *   ALIEXPRESS_TRACKING_ID — affiliate tracking ID from Portals
 *
 * Docs: https://openservice.aliexpress.com/doc/doc.htm
 */
import crypto from "crypto";

// Singapore endpoint — fastest for global developers
const API_URL = "https://api-sg.aliexpress.com/sync";

type ApiParams = Record<string, string>;

/**
 * TOP-style signing:
 *   1. Sort params alphabetically by key
 *   2. Concatenate: key1value1key2value2...
 *   3. HMAC-SHA256(secret, concatenated).toUpperCase()
 */
function signRequest(params: ApiParams, secret: string): string {
  const sortedKeys = Object.keys(params).sort();
  const concatenated = sortedKeys.map(k => `${k}${params[k]}`).join("");
  return crypto
    .createHmac("sha256", secret)
    .update(concatenated, "utf8")
    .digest("hex")
    .toUpperCase();
}

async function callApi<T = unknown>(
  method: string,
  bizParams: Record<string, string | number | undefined>,
): Promise<T | null> {
  const appKey = process.env.ALIEXPRESS_APP_KEY;
  const appSecret = process.env.ALIEXPRESS_APP_SECRET;
  if (!appKey || !appSecret) {
    console.warn("AliExpress API: missing ALIEXPRESS_APP_KEY or ALIEXPRESS_APP_SECRET");
    return null;
  }

  // System params
  const params: ApiParams = {
    method,
    app_key: appKey,
    sign_method: "sha256",
    timestamp: String(Date.now()),
    format: "json",
    v: "2.0",
  };

  // Merge biz params (skip undefined)
  for (const [k, v] of Object.entries(bizParams)) {
    if (v !== undefined && v !== null && v !== "") params[k] = String(v);
  }

  params.sign = signRequest(params, appSecret);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: new URLSearchParams(params).toString(),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`AliExpress API ${method}: HTTP ${res.status}`);
      return null;
    }
    const data = await res.json() as T & { error_response?: { msg?: string; code?: string } };
    if (data.error_response) {
      console.error(`AliExpress API ${method} error:`, data.error_response.msg || data.error_response.code);
      return null;
    }
    return data;
  } catch (err) {
    console.error(`AliExpress API ${method} failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Affiliate Link Generator ────────────────────────────────────────────────

interface LinkGenerateResponse {
  aliexpress_affiliate_link_generate_response?: {
    resp_result?: {
      result?: {
        promotion_links?: {
          promotion_link?: Array<{
            source_value: string;
            promotion_link: string;
          }>;
        };
      };
      resp_code?: number;
      resp_msg?: string;
    };
  };
}

/**
 * Convert a batch of raw AliExpress product URLs into affiliate-tracked URLs.
 * Returns a Map<originalUrl, affiliateUrl>. URLs that failed conversion are omitted.
 *
 * AliExpress enforces rate limits (~60 req/min). Batch calls reduce quota usage.
 */
export async function generateAffiliateLinks(urls: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const trackingId = process.env.ALIEXPRESS_TRACKING_ID;
  if (!trackingId || urls.length === 0) return result;

  // AliExpress limit: max 50 URLs per batch, comma-separated
  const batch = urls.slice(0, 50);

  const response = await callApi<LinkGenerateResponse>("aliexpress.affiliate.link.generate", {
    promotion_link_type: "0",    // 0 = normal link, 2 = shortened link
    source_values: batch.join(","),
    tracking_id: trackingId,
  });

  const links = response?.aliexpress_affiliate_link_generate_response?.resp_result?.result?.promotion_links?.promotion_link;
  if (Array.isArray(links)) {
    for (const link of links) {
      if (link.source_value && link.promotion_link) {
        result.set(link.source_value, link.promotion_link);
      }
    }
  }
  return result;
}

// ─── Affiliate Product Query (search) ────────────────────────────────────────

export interface AliApiProduct {
  productId: string;
  title: string;
  imageUrl: string;
  salePriceUsd: number;
  originalPriceUsd: number | null;
  evaluateRate: string;  // "4.9" or "94.5%"
  lastestVolume: number;  // orders count
  productDetailUrl: string;  // already wrapped with affiliate link when queried via API
  promotionLink: string;     // explicit affiliate link
  commissionRate: string;    // "8.0%"
  shopTitle: string;
}

interface ProductQueryResponse {
  aliexpress_affiliate_product_query_response?: {
    resp_result?: {
      result?: {
        products?: {
          product?: Array<{
            product_id?: string | number;
            product_title?: string;
            product_main_image_url?: string;
            sale_price?: string;
            sale_price_currency?: string;
            original_price?: string;
            original_price_currency?: string;
            evaluate_rate?: string;
            lastest_volume?: number;
            product_detail_url?: string;
            promotion_link?: string;
            commission_rate?: string;
            shop_title?: string;
          }>;
        };
        total_record_count?: number;
      };
      resp_code?: number;
    };
  };
}

/**
 * Search AliExpress for products matching a keyword.
 * Returns products with affiliate links already attached (via API).
 *
 * Sort options:
 *   SALE_PRICE_ASC | SALE_PRICE_DESC
 *   LAST_VOLUME_ASC | LAST_VOLUME_DESC (best selling)
 *   COMMISSION_ASC | COMMISSION_DESC
 */
export async function queryAffiliateProducts(
  keywords: string,
  options: {
    pageSize?: number;
    pageNo?: number;
    sort?: "LAST_VOLUME_DESC" | "SALE_PRICE_ASC" | "SALE_PRICE_DESC" | "COMMISSION_DESC";
    minSalePrice?: number;  // USD
    maxSalePrice?: number;  // USD
    targetCurrency?: string; // e.g. "USD", "EUR", "GBP"
    targetLanguage?: string; // e.g. "EN", "DE", "FR"
    shipToCountry?: string;  // ISO 3166 alpha-2 code, e.g. "US", "GB", "DE"
  } = {},
): Promise<AliApiProduct[]> {
  const trackingId = process.env.ALIEXPRESS_TRACKING_ID;
  if (!trackingId || !keywords) return [];

  const response = await callApi<ProductQueryResponse>("aliexpress.affiliate.product.query", {
    keywords,
    page_size: String(options.pageSize ?? 15),
    page_no: String(options.pageNo ?? 1),
    sort: options.sort ?? "LAST_VOLUME_DESC",
    target_currency: options.targetCurrency ?? "USD",
    target_language: options.targetLanguage ?? "EN",
    tracking_id: trackingId,
    min_sale_price: options.minSalePrice != null ? String(Math.round(options.minSalePrice * 100)) : undefined,
    max_sale_price: options.maxSalePrice != null ? String(Math.round(options.maxSalePrice * 100)) : undefined,
    ship_to_country: options.shipToCountry ?? "US",
  });

  const products = response?.aliexpress_affiliate_product_query_response?.resp_result?.result?.products?.product;
  if (!Array.isArray(products)) return [];

  return products
    .filter(p => p.product_id && p.product_title && p.sale_price)
    .map(p => {
      const salePrice = parseFloat(String(p.sale_price ?? "0")) || 0;
      const originalPrice = p.original_price ? parseFloat(String(p.original_price)) : null;
      let img = String(p.product_main_image_url ?? "");
      if (img.startsWith("//")) img = "https:" + img;
      return {
        productId: String(p.product_id),
        title: String(p.product_title).slice(0, 150),
        imageUrl: img,
        salePriceUsd: salePrice,
        originalPriceUsd: originalPrice && !isNaN(originalPrice) ? originalPrice : null,
        evaluateRate: String(p.evaluate_rate ?? ""),
        lastestVolume: typeof p.lastest_volume === "number" ? p.lastest_volume : 0,
        productDetailUrl: String(p.product_detail_url ?? ""),
        promotionLink: String(p.promotion_link ?? p.product_detail_url ?? ""),
        commissionRate: String(p.commission_rate ?? ""),
        shopTitle: String(p.shop_title ?? ""),
      };
    });
}

export function isAliApiConfigured(): boolean {
  return !!(process.env.ALIEXPRESS_APP_KEY && process.env.ALIEXPRESS_APP_SECRET && process.env.ALIEXPRESS_TRACKING_ID);
}
