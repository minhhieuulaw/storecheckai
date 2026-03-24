import * as cheerio from "cheerio";
import type { ScrapedData, SecurityHeaders, ScrapedProduct } from "./types";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const TIMEOUT = 12000;

// Headers giả lập US browser — giúp nhận đúng giá USD và tránh geo-block
const US_HEADERS: Record<string, string> = {
  "User-Agent": UA,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  "Sec-Ch-Ua": '"Chromium";v="120", "Google Chrome";v="120", "Not-A.Brand";v="99"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Upgrade-Insecure-Requests": "1",
};

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    const res = await fetch(url, {
      headers: US_HEADERS,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

interface HeadResult {
  headers: SecurityHeaders;
  redirectsToNewDomain: boolean;
}

async function checkHeadRequest(url: string): Promise<HeadResult> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: US_HEADERS,
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    const h = res.headers;
    const inputHost = new URL(url).hostname.replace("www.", "");
    let finalHost = inputHost;
    try { finalHost = new URL(res.url).hostname.replace("www.", ""); } catch { /* ignore */ }
    return {
      headers: {
        hsts: h.has("strict-transport-security"),
        xFrameOptions: h.has("x-frame-options"),
        csp: h.has("content-security-policy"),
        xContentTypeOptions: h.has("x-content-type-options"),
      },
      redirectsToNewDomain: finalHost !== inputHost,
    };
  } catch {
    return {
      headers: { hsts: false, xFrameOptions: false, csp: false, xContentTypeOptions: false },
      redirectsToNewDomain: false,
    };
  }
}

async function getTrustpilotData(domain: string): Promise<{ rating: number | null; reviewCount: number | null }> {
  // Strip subdomains — use registrable domain only
  const parts = domain.split(".");
  const registrable = parts.length >= 2 ? parts.slice(-2).join(".") : domain;
  try {
    const html = await fetchPage(`https://www.trustpilot.com/review/${registrable}`);
    if (!html) return { rating: null, reviewCount: null };
    // Extract JSON-LD aggregateRating
    const $ = cheerio.load(html);
    let rating: number | null = null;
    let reviewCount: number | null = null;
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || "{}");
        const entries = Array.isArray(json) ? json : [json];
        for (const entry of entries) {
          const ar = entry?.aggregateRating ?? entry?.["@graph"]?.[0]?.aggregateRating;
          if (ar?.ratingValue) {
            rating = parseFloat(ar.ratingValue);
            reviewCount = parseInt(ar.reviewCount ?? ar.ratingCount ?? "0", 10) || null;
            return false; // break
          }
        }
      } catch { /* ignore malformed JSON */ }
    });
    return { rating, reviewCount };
  } catch {
    return { rating: null, reviewCount: null };
  }
}

function detectManipulationTactics(html: string): string[] {
  const h = html.toLowerCase();
  const tactics: string[] = [];

  const checks: [RegExp | string, string][] = [
    [/countdown[_\-]?timer|count[-_]?down|flip[-_]?clock/, "Countdown timer detected"],
    [/only\s+\d+\s+left|only\s+\d+\s+remaining|limited\s+stock|almost\s+sold\s+out/, "Fake low-stock warning"],
    [/\d+\s+people?\s+(are\s+)?(viewing|watching|looking)|currently\s+viewing/, "Fake viewer counter"],
    [/sold\s+in\s+(the\s+)?last\s+\d+\s+hours?|\d+\s+(people?\s+)?bought\s+(this\s+)?today/, "Fake 'sold recently' counter"],
    [/hurry[!,.]?\s+(only|just|limited)|act\s+fast|don'?t\s+miss/, "Urgency pressure language"],
    [/price\s+goes?\s+up|deal\s+expires?|offer\s+ends?/, "Artificial price deadline"],
  ];

  for (const [pattern, label] of checks) {
    const hit = typeof pattern === "string" ? h.includes(pattern) : pattern.test(h);
    if (hit) tactics.push(label);
  }
  return tactics;
}

function detectBusinessRegistration(text: string): { found: boolean; entityType: string | null } {
  const patterns: [RegExp, string][] = [
    [/\b(LLC|L\.L\.C\.?)\b/, "LLC"],
    [/\bInc\.?\b|\bIncorporated\b/, "Inc."],
    [/\bCorp\.?\b|\bCorporation\b/, "Corp."],
    [/\bLtd\.?\b|\bLimited\b/, "Ltd."],
    [/\bCo\.\s+LLC\b|\bCo\.,?\s+Inc\b/, "Co."],
  ];
  for (const [re, label] of patterns) {
    if (re.test(text)) return { found: true, entityType: label };
  }
  return { found: false, entityType: null };
}

function detectReviewPlatforms(html: string): string[] {
  const h = html.toLowerCase();
  const platforms: [string, string][] = [
    ["yotpo", "Yotpo"],
    ["judge.me", "Judge.me"],
    ["loox.io", "Loox"],
    ["okendo", "Okendo"],
    ["stamped.io", "Stamped.io"],
    ["reviews.io", "Reviews.io"],
    ["powerreviews", "PowerReviews"],
    ["bazaarvoice", "Bazaarvoice"],
    ["trustpilot.com/evaluate", "Trustpilot Widget"],
    ["reviewsio", "Reviews.io"],
  ];
  const found: string[] = [];
  for (const [pattern, label] of platforms) {
    if (h.includes(pattern)) found.push(label);
  }
  return found;
}

function detectCookieConsent(html: string): boolean {
  const h = html.toLowerCase();
  const patterns = [
    "onetrust", "optanon", "cookiebot", "cookieyes", "osano",
    "cookie-banner", "cookie-notice", "cookie-consent", "gdpr-cookie",
    "ccpa-notice", "cookiepro", "trustarc", "cookie_notice",
  ];
  return patterns.some((p) => h.includes(p));
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function extractBaseUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}`;
  } catch {
    return url;
  }
}

function findLinks($: cheerio.CheerioAPI, base: string, keywords: string[]): string | null {
  let found: string | null = null;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().toLowerCase();
    const hrefLower = href.toLowerCase();
    for (const kw of keywords) {
      if (hrefLower.includes(kw) || text.includes(kw)) {
        found = href.startsWith("http") ? href : `${base}${href.startsWith("/") ? href : "/" + href}`;
        return false; // break
      }
    }
  });
  return found;
}

function extractEmail(text: string): string | null {
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

function hasPhonePattern(text: string): boolean {
  return /(\+1[-.\\s]?)?\(?\d{3}\)?[-.\\s]?\d{3}[-.\\s]?\d{4}/.test(text);
}

function hasAddressPattern(text: string): boolean {
  return /\d{1,5}\s+\w+\s+(st|street|ave|avenue|blvd|boulevard|rd|road|dr|drive|ln|lane|way|ct|court)/i.test(text);
}

function extractSocialLinks($: cheerio.CheerioAPI): string[] {
  const platforms = ["facebook.com", "instagram.com", "twitter.com", "x.com", "tiktok.com", "youtube.com", "pinterest.com", "linkedin.com"];
  const found = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    for (const p of platforms) {
      if (href.includes(p)) {
        found.add(p.replace(".com", ""));
        break;
      }
    }
  });
  return Array.from(found);
}

function detectPaymentMethods(html: string): string[] {
  const h = html.toLowerCase();
  const checks: [string | RegExp, string][] = [
    ["paypal", "PayPal"],
    [/apple[_\-\s]?pay/, "Apple Pay"],
    [/google[_\-\s]?pay/, "Google Pay"],
    [/shop[_\-\s]?pay|shopify[_\-\s]?pay/, "Shop Pay"],
    ["stripe", "Stripe"],
    ["klarna", "Klarna"],
    ["afterpay", "Afterpay"],
    ["affirm", "Affirm"],
    ["sezzle", "Sezzle"],
    ["amazon[_\\-\\s]?pay", "Amazon Pay"],
    ["venmo", "Venmo"],
    // Card networks — only if context strongly suggests payment
    [/accepts?\s+visa|visa[_\-\s]?card|visa[_\-\s]?checkout/, "Visa"],
    [/mastercard/, "Mastercard"],
    [/amex|american\s+express/, "American Express"],
    [/discover\s+card|discover\s+payment/, "Discover"],
  ];

  const found: string[] = [];
  const seen = new Set<string>();
  for (const [pattern, label] of checks) {
    if (seen.has(label)) continue;
    const matches = typeof pattern === "string" ? h.includes(pattern) : pattern.test(h);
    if (matches) {
      found.push(label);
      seen.add(label);
    }
  }
  return found;
}

function scoreAboutQuality(text: string): number {
  if (!text || text.length < 100) return 0;
  let score = 1; // Exists
  if (text.length > 500) score++;
  if (/founded|established|since\s+\d{4}|started\s+in/i.test(text)) score++;
  if (/team|staff|founder|owner|mission|values|story|family/i.test(text)) score++;
  return Math.min(3, score);
}

function detectShippingOrigin(text: string): { shipsFromUS: boolean | null; signals: string[] } {
  const t = text.toLowerCase();
  const signals: string[] = [];

  const usPatterns = [
    "ships from us", "ships from usa", "ships from united states",
    "us warehouse", "usa warehouse", "shipped from us", "domestic shipping",
    "ships within 1-3 business", "ships within 1-2 business", "same day shipping",
    "next day shipping", "ships from our us",
  ];
  const intlPatterns = [
    "ships from china", "ships from hong kong", "ships from taiwan",
    "3-5 weeks", "4-6 weeks", "2-4 weeks", "allow 3", "allow 4",
    "epacket", "china post", "international warehouse", "overseas warehouse",
    "transit time 15", "transit time 20", "transit time 25",
  ];

  let usHits = 0, intlHits = 0;
  for (const p of usPatterns) {
    if (t.includes(p)) { usHits++; signals.push(`Ships from US: "${p}"`); }
  }
  for (const p of intlPatterns) {
    if (t.includes(p)) { intlHits++; signals.push(`Long shipping / overseas: "${p}"`); }
  }

  if (intlHits > 0) return { shipsFromUS: false, signals };
  if (usHits > 0) return { shipsFromUS: true, signals };
  return { shipsFromUS: null, signals };
}

// Cache IANA bootstrap in memory — fetched once per server session
let rdapBootstrapCache: Map<string, string> | null = null;

async function getRdapServer(tld: string): Promise<string | null> {
  if (!rdapBootstrapCache) {
    try {
      const res = await fetch("https://data.iana.org/rdap/dns.json", {
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 86400 }, // cache 24h in Next.js
      } as RequestInit);
      if (!res.ok) return null;
      const data = await res.json() as { services: [string[], string[]][] };
      rdapBootstrapCache = new Map();
      for (const [tlds, urls] of data.services) {
        for (const t of tlds) rdapBootstrapCache.set(t.toLowerCase(), urls[0]);
      }
    } catch {
      return null;
    }
  }
  return rdapBootstrapCache.get(tld) ?? null;
}

async function getDomainAge(domain: string): Promise<{ ageDays: number | null; createdAt: string | null }> {
  // Use registrable domain only (strip subdomains for RDAP)
  const parts = domain.split(".");
  const registrable = parts.length >= 2 ? parts.slice(-2).join(".") : domain;
  const tld = parts[parts.length - 1].toLowerCase();

  // Skip domain age for known platform subdomains (age would reflect the platform, not the store)
  const platformDomains = ["myshopify.com", "etsy.com", "amazon.com", "walmart.com", "ebay.com"];
  if (platformDomains.some((p) => domain.endsWith(p) && domain !== p)) {
    return { ageDays: null, createdAt: null };
  }

  // Find RDAP server via IANA bootstrap
  const rdapBase = await getRdapServer(tld);
  if (!rdapBase) return { ageDays: null, createdAt: null };

  try {
    const rdapUrl = `${rdapBase}domain/${registrable}`;
    const res = await fetch(rdapUrl, {
      headers: { Accept: "application/rdap+json" },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    if (!res.ok) return { ageDays: null, createdAt: null };
    const data = await res.json() as { events?: Array<{ eventAction: string; eventDate: string }> };
    const reg = data.events?.find((e) => e.eventAction === "registration");
    if (!reg?.eventDate) return { ageDays: null, createdAt: null };
    const created = new Date(reg.eventDate);
    const ageDays = Math.floor((Date.now() - created.getTime()) / 86_400_000);
    return { ageDays, createdAt: reg.eventDate };
  } catch {
    return { ageDays: null, createdAt: null };
  }
}

// ─── Product scraping ────────────────────────────────────────────────────────

interface ShopifyProductJson {
  title: string;
  handle: string;
  variants: Array<{ price: string }>;
  images: Array<{ src: string }>;
}

/** Detect the store's display currency from raw HTML */
function detectStoreCurrency(html: string): string {
  // Shopify embeds currency in JS: Shopify.currency = {"active":"VND",...}
  const m =
    html.match(/"active"\s*:\s*"([A-Z]{3})"/) ||
    html.match(/"currency"\s*:\s*"([A-Z]{3})"/) ||
    html.match(/priceCurrency["']\s*:\s*["']([A-Z]{3})["']/);
  if (m) return m[1];
  // Fallback: currency symbols in page
  if (html.includes("₫") || html.includes("VND")) return "VND";
  if (html.includes(" £") || html.includes(">£")) return "GBP";
  if (html.includes(" €") || html.includes(">€")) return "EUR";
  if (html.includes("A$") || html.includes("AUD")) return "AUD";
  if (html.includes("C$") || html.includes("CAD")) return "CAD";
  return "USD";
}

// Approximate exchange rates to USD (good enough for price comparison context)
const TO_USD: Record<string, number> = {
  VND: 1 / 25000,
  IDR: 1 / 15500,
  THB: 1 / 35,
  KRW: 1 / 1350,
  JPY: 1 / 150,
  MYR: 1 / 4.7,
  PHP: 1 / 56,
  TWD: 1 / 32,
  CNY: 1 / 7.2,
  EUR: 1.08,
  GBP: 1.27,
  AUD: 0.65,
  CAD: 0.74,
  SGD: 0.75,
  HKD: 0.13,
};

/** Format a price with currency symbol only (no USD note — USD equivalent shown separately via priceUsd) */
function formatPrice(num: number, currency: string): string {
  if (currency === "USD") return `$${num.toFixed(2)}`;
  switch (currency) {
    case "VND": return `${Math.round(num).toLocaleString("en-US")} ₫`;
    case "EUR": return `€${num.toFixed(2)}`;
    case "GBP": return `£${num.toFixed(2)}`;
    case "JPY": return `¥${Math.round(num).toLocaleString("en-US")}`;
    case "KRW": return `₩${Math.round(num).toLocaleString("en-US")}`;
    default:    return `${num.toFixed(2)} ${currency}`;
  }
}

function toUsd(num: number, currency: string): number | null {
  if (currency === "USD") return null; // already USD, no conversion needed
  const rate = TO_USD[currency];
  return rate ? parseFloat((num * rate).toFixed(2)) : null;
}

async function fetchShopifyProducts(baseUrl: string, currency: string): Promise<ScrapedProduct[]> {
  try {
    const res = await fetch(`${baseUrl}/products.json?limit=6`, {
      headers: US_HEADERS,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json() as { products: ShopifyProductJson[] };
    return (data.products ?? []).slice(0, 6).flatMap(p => {
      const rawPrice = p.variants?.[0]?.price;
      if (!p.title || !rawPrice) return [];
      const num = parseFloat(rawPrice);
      if (isNaN(num)) return [];
      return [{
        name: p.title,
        price: formatPrice(num, currency),
        priceNumeric: num,
        priceUsd: toUsd(num, currency),
        image: p.images?.[0]?.src ?? null,
        url: `${baseUrl}/products/${p.handle}`,
        currency,
      }];
    });
  } catch {
    return [];
  }
}

function parseJsonLdProducts($: cheerio.CheerioAPI, baseUrl: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || "{}");
      const entries: unknown[] = Array.isArray(json) ? json : [json];
      for (const entry of entries) {
        const e = entry as Record<string, unknown>;
        if (e["@type"] !== "Product") continue;
        const offer = (e.offers as Record<string, unknown>) ?? {};
        const price = (offer.price ?? (offer as Record<string, unknown[]>).offers?.[0]) as string | undefined;
        const rawImage = e.image;
        const imageStr = Array.isArray(rawImage) ? String(rawImage[0]) : rawImage ? String(rawImage) : null;
        const num = price ? parseFloat(String(price)) : NaN;
        if (!e.name || !price || isNaN(num)) continue;
        const currency = String((offer.priceCurrency as string) || "USD");
        products.push({
          name: String(e.name).slice(0, 120),
          price: formatPrice(num, currency),
          priceNumeric: num,
          priceUsd: toUsd(num, currency),
          image: imageStr ? (imageStr.startsWith("http") ? imageStr : `${baseUrl}${imageStr}`) : null,
          url: e.url ? String(e.url) : null,
          currency,
        });
      }
    } catch { /* ignore malformed JSON-LD */ }
  });
  return products.slice(0, 6);
}

export async function scrapeStore(rawUrl: string): Promise<ScrapedData> {
  const domain = extractDomain(rawUrl);
  const baseUrl = extractBaseUrl(rawUrl);
  const isHttps = rawUrl.startsWith("https://");

  const base: ScrapedData = {
    url: rawUrl,
    domain,
    isHttps,
    pageTitle: domain,
    hasContactPage: false,
    hasPrivacyPolicy: false,
    hasReturnPolicy: false,
    hasTermsOfService: false,
    hasPhoneNumber: false,
    hasEmailAddress: false,
    hasAddress: false,
    hasSocialLinks: false,
    socialLinks: [],
    contactEmail: null,
    returnPolicyText: null,
    aboutText: null,
    isShopify: false,
    ogImage: null,
    ogDescription: null,
    domainAgeDays: null,
    domainCreatedAt: null,
    // Tier 1
    hasShippingPolicy: false,
    shippingPolicyText: null,
    paymentMethods: [],
    emailDomainMatch: null,
    hasAboutPage: false,
    aboutQualityScore: 0,
    securityHeaders: { hsts: false, xFrameOptions: false, csp: false, xContentTypeOptions: false },
    shipsFromUS: null,
    shippingOriginSignals: [],
    // Products
    products: [],
    // Tier 2
    trustpilotRating: null,
    trustpilotReviewCount: null,
    manipulationTactics: [],
    hasCookieConsent: false,
    hasBusinessRegistration: false,
    businessEntityType: null,
    hasSiteReviews: false,
    reviewPlatforms: [],
    redirectsToNewDomain: false,
  };

  // Fetch main page
  const mainHtml = await fetchPage(rawUrl);
  if (!mainHtml) {
    return { ...base, scrapeError: "Could not load the page. It may be blocking automated requests." };
  }

  const $ = cheerio.load(mainHtml);

  // Page title
  base.pageTitle = $("title").first().text().trim() || domain;

  // OG image & description
  const ogImg = $('meta[property="og:image"]').attr("content") || $('meta[name="twitter:image"]').attr("content") || null;
  if (ogImg) {
    base.ogImage = ogImg.startsWith("http") ? ogImg : `${baseUrl}${ogImg.startsWith("/") ? ogImg : "/" + ogImg}`;
  }
  base.ogDescription = $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content") || null;

  // Shopify detection
  base.isShopify =
    mainHtml.includes("cdn.shopify.com") ||
    mainHtml.includes("Shopify.shop") ||
    $('meta[name="shopify-digital-wallet"]').length > 0;

  // Social links
  base.socialLinks = extractSocialLinks($);
  base.hasSocialLinks = base.socialLinks.length > 0;

  // Phone + address from main page
  const mainText = $("body").text();
  base.hasPhoneNumber = hasPhonePattern(mainText);
  base.hasAddress = hasAddressPattern(mainText);
  base.contactEmail = extractEmail(mainText);
  base.hasEmailAddress = !!base.contactEmail;

  // Payment methods from main HTML
  base.paymentMethods = detectPaymentMethods(mainHtml);

  // Tier 2 — analysis of already-fetched mainHtml (free, no extra requests)
  base.manipulationTactics = detectManipulationTactics(mainHtml);
  base.hasCookieConsent = detectCookieConsent(mainHtml);
  base.reviewPlatforms = detectReviewPlatforms(mainHtml);
  base.hasSiteReviews = base.reviewPlatforms.length > 0;
  const footerText = $("footer, .footer, #footer").text() + $("body").text().slice(-3000);
  const bizReg = detectBusinessRegistration(footerText);
  base.hasBusinessRegistration = bizReg.found;
  base.businessEntityType = bizReg.entityType;

  // Find policy/page URLs from nav/footer
  const returnUrl = findLinks($, baseUrl, ["return", "refund"]);
  const privacyUrl = findLinks($, baseUrl, ["privacy"]);
  const termsUrl = findLinks($, baseUrl, ["terms", "conditions"]);
  const contactUrl = findLinks($, baseUrl, ["contact", "support", "help"]);
  const shippingUrl = findLinks($, baseUrl, ["shipping", "delivery"]);
  const aboutUrl = findLinks($, baseUrl, ["about", "our-story", "who-we-are"]);

  // Fetch all policy pages + security/redirect check + Trustpilot + domain age + products in parallel
  const [returnHtml, privacyHtml, termsHtml, contactHtml, shippingHtml, aboutHtml, headResult, trustpilot, domainAge, shopifyProducts] = await Promise.all([
    returnUrl ? fetchPage(returnUrl) : Promise.resolve(null),
    privacyUrl ? fetchPage(privacyUrl) : Promise.resolve(null),
    termsUrl ? fetchPage(termsUrl) : Promise.resolve(null),
    contactUrl ? fetchPage(contactUrl) : Promise.resolve(null),
    shippingUrl ? fetchPage(shippingUrl) : Promise.resolve(null),
    aboutUrl ? fetchPage(aboutUrl) : Promise.resolve(null),
    checkHeadRequest(rawUrl),
    getTrustpilotData(domain),
    getDomainAge(domain),
    base.isShopify ? fetchShopifyProducts(baseUrl, detectStoreCurrency(mainHtml)) : Promise.resolve([] as ScrapedProduct[]),
  ]);

  // Products — Shopify first, fallback to JSON-LD from main page
  base.products = shopifyProducts.length > 0 ? shopifyProducts : parseJsonLdProducts($, baseUrl);

  base.securityHeaders = headResult.headers;
  base.redirectsToNewDomain = headResult.redirectsToNewDomain;
  base.trustpilotRating = trustpilot.rating;
  base.trustpilotReviewCount = trustpilot.reviewCount;
  base.domainAgeDays = domainAge.ageDays;
  base.domainCreatedAt = domainAge.createdAt;

  if (returnHtml) {
    base.hasReturnPolicy = true;
    const $r = cheerio.load(returnHtml);
    base.returnPolicyText = $r("body").text().replace(/\s+/g, " ").trim().slice(0, 2000);
  } else {
    // Check if content exists on main page itself
    const bodyText = mainText.toLowerCase();
    if (bodyText.includes("return policy") || bodyText.includes("refund policy")) {
      base.hasReturnPolicy = true;
      base.returnPolicyText = mainText.slice(0, 2000);
    }
  }

  if (privacyHtml) base.hasPrivacyPolicy = true;
  if (termsHtml) base.hasTermsOfService = true;

  // Shipping policy
  if (shippingHtml) {
    base.hasShippingPolicy = true;
    const $s = cheerio.load(shippingHtml);
    const shippingText = $s("body").text().replace(/\s+/g, " ").trim();
    base.shippingPolicyText = shippingText.slice(0, 2000);
    // Detect shipping origin from policy page
    const originResult = detectShippingOrigin(shippingText);
    base.shipsFromUS = originResult.shipsFromUS;
    base.shippingOriginSignals = originResult.signals;
  } else {
    // Try detecting from main page text
    const bodyText = mainText.toLowerCase();
    if (bodyText.includes("shipping policy") || bodyText.includes("shipping information")) {
      base.hasShippingPolicy = true;
      base.shippingPolicyText = mainText.slice(0, 2000);
    }
    const originResult = detectShippingOrigin(mainText);
    base.shipsFromUS = originResult.shipsFromUS;
    base.shippingOriginSignals = originResult.signals;
  }

  // About page
  if (aboutHtml) {
    base.hasAboutPage = true;
    const $a = cheerio.load(aboutHtml);
    const aboutText = $a("body").text().replace(/\s+/g, " ").trim();
    base.aboutText = aboutText.slice(0, 1500);
    base.aboutQualityScore = scoreAboutQuality(aboutText);
    // Also check for extra payment methods on about page
    const extraMethods = detectPaymentMethods(aboutHtml);
    const combined = new Set([...base.paymentMethods, ...extraMethods]);
    base.paymentMethods = Array.from(combined);
  }

  if (contactHtml) {
    base.hasContactPage = true;
    const $c = cheerio.load(contactHtml);
    const contactText = $c("body").text();
    if (!base.contactEmail) {
      base.contactEmail = extractEmail(contactText);
      base.hasEmailAddress = !!base.contactEmail;
    }
    if (!base.hasPhoneNumber) base.hasPhoneNumber = hasPhonePattern(contactText);
    if (!base.hasAddress) base.hasAddress = hasAddressPattern(contactText);
  }

  // Email domain match check (after contact page, so email is finalized)
  if (base.contactEmail) {
    const emailDomain = base.contactEmail.split("@")[1]?.toLowerCase() ?? "";
    const freeProviders = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"];
    if (!freeProviders.includes(emailDomain)) {
      base.emailDomainMatch = emailDomain === domain || domain.endsWith("." + emailDomain);
    } else {
      base.emailDomainMatch = false; // Free provider = no domain match
    }
  }

  // Shopify stores often have standard policy URLs — try them directly
  if (base.isShopify && !base.hasReturnPolicy) {
    const sfReturn = await fetchPage(`${baseUrl}/policies/refund-policy`);
    if (sfReturn) {
      base.hasReturnPolicy = true;
      const $sf = cheerio.load(sfReturn);
      base.returnPolicyText = $sf("body").text().replace(/\s+/g, " ").trim().slice(0, 2000);
    }
  }
  if (base.isShopify && !base.hasShippingPolicy) {
    const sfShipping = await fetchPage(`${baseUrl}/policies/shipping-policy`);
    if (sfShipping) {
      base.hasShippingPolicy = true;
      const $sf = cheerio.load(sfShipping);
      const txt = $sf("body").text().replace(/\s+/g, " ").trim();
      base.shippingPolicyText = txt.slice(0, 2000);
      if (!base.shippingOriginSignals.length) {
        const originResult = detectShippingOrigin(txt);
        base.shipsFromUS = originResult.shipsFromUS;
        base.shippingOriginSignals = originResult.signals;
      }
    }
  }

  return base;
}
