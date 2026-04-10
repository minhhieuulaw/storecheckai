/**
 * Amazon Affiliate Tag Utility
 *
 * Single source of truth for appending/replacing affiliate tags on Amazon URLs.
 * Handles all Amazon domains, short links, edge cases, and preserves existing params.
 */

const AMAZON_DOMAINS = new Set([
  "amazon.com", "www.amazon.com",
  "amazon.ca", "www.amazon.ca",
  "amazon.co.uk", "www.amazon.co.uk",
  "amazon.de", "www.amazon.de",
  "amazon.fr", "www.amazon.fr",
  "amazon.it", "www.amazon.it",
  "amazon.es", "www.amazon.es",
  "amazon.co.jp", "www.amazon.co.jp",
  "amazon.com.au", "www.amazon.com.au",
  "amazon.com.br", "www.amazon.com.br",
  "amazon.in", "www.amazon.in",
  "amazon.nl", "www.amazon.nl",
  "amazon.sg", "www.amazon.sg",
  "amazon.sa", "www.amazon.sa",
  "amazon.ae", "www.amazon.ae",
  "amazon.com.mx", "www.amazon.com.mx",
]);

// Short link domains — tag is appended but may not survive redirect
// (Amazon short links typically do pass through query params)
const AMAZON_SHORT_DOMAINS = new Set([
  "amzn.to", "www.amzn.to",
  "a.co", "www.a.co",
]);

function isAmazonDomain(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return AMAZON_DOMAINS.has(lower) || AMAZON_SHORT_DOMAINS.has(lower);
}

/**
 * Append or replace Amazon affiliate tag on a URL.
 *
 * Rules:
 * - Non-Amazon URLs: returned unchanged
 * - Amazon URL without tag: appends tag
 * - Amazon URL with different tag: replaces with ours
 * - Amazon URL with correct tag: returned unchanged
 * - Preserves all other query params and hash fragments
 * - Uses URL parser (no string concat)
 * - Handles malformed URLs gracefully (returns unchanged)
 *
 * @param url - The URL to process
 * @param tag - The affiliate tag (defaults to AMAZON_AFFILIATE_TAG env var)
 * @returns The URL with affiliate tag applied (or unchanged if not Amazon)
 */
export function appendAmazonAffiliateTag(url: string, tag?: string): string {
  const affiliateTag = tag ?? process.env.AMAZON_AFFILIATE_TAG;

  // No tag configured — return unchanged
  if (!affiliateTag) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // Malformed URL — return unchanged
    return url;
  }

  // Not Amazon — return unchanged
  if (!isAmazonDomain(parsed.hostname)) return url;

  // Check existing tag
  const existingTag = parsed.searchParams.get("tag");
  if (existingTag === affiliateTag) {
    // Already has correct tag — return unchanged
    return url;
  }

  // Set (or replace) the tag
  parsed.searchParams.set("tag", affiliateTag);

  return parsed.toString();
}

/**
 * Check if a URL is an Amazon short link (amzn.to, a.co).
 * These may not reliably pass the tag through redirect — caller should note this.
 */
export function isAmazonShortLink(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return AMAZON_SHORT_DOMAINS.has(hostname);
  } catch {
    return false;
  }
}

// ─── AliExpress Affiliate Tag ────────────────────────────────────────────────

const ALIEXPRESS_DOMAINS = new Set([
  "aliexpress.com", "www.aliexpress.com",
  "aliexpress.us", "www.aliexpress.us",
  "s.click.aliexpress.com",
  "star.aliexpress.com",
]);

function isAliExpressDomain(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return ALIEXPRESS_DOMAINS.has(lower) || lower.endsWith(".aliexpress.com");
}

/**
 * Manual AliExpress affiliate tag wrapper (fallback when Open Platform API fails).
 *
 * Appends tracking params:
 *   sk={tracking_id}     — the tracking/Portals ID
 *   aff_platform=portals-tool
 *
 * PREFER: `generateAffiliateLinks()` from lib/aliexpress-api.ts for proper s.click.aliexpress.com
 * shortened links — those guarantee commission attribution. This manual wrap is a best-effort
 * fallback only (works for direct product URLs but NOT guaranteed to track clicks).
 *
 * @param url       AliExpress URL to wrap
 * @param trackingId Override tracking ID (defaults to ALIEXPRESS_TRACKING_ID env var)
 * @returns Wrapped URL, or original if not AliExpress / no tracking ID configured
 */
export function appendAliExpressAffiliateTag(url: string, trackingId?: string): string {
  const tid = trackingId ?? process.env.ALIEXPRESS_TRACKING_ID;
  if (!tid) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  if (!isAliExpressDomain(parsed.hostname)) return url;

  // If already a s.click.aliexpress.com short link, leave it alone (already tracked)
  if (parsed.hostname === "s.click.aliexpress.com") return url;

  // Add tracking params
  parsed.searchParams.set("sk", tid);
  parsed.searchParams.set("aff_platform", "portals-tool");
  return parsed.toString();
}
