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

async function getTrustpilotData(domain: string): Promise<{ rating: number | null; reviewCount: number | null; reviews: string[] }> {
  // Try both registrable domain and full domain
  const parts = domain.split(".");
  const registrable = parts.length >= 2 ? parts.slice(-2).join(".") : domain;
  const candidates = registrable !== domain ? [registrable, domain] : [registrable];

  for (const candidate of candidates) {
    try {
      const html = await fetchPage(`https://www.trustpilot.com/review/${candidate}`);
      if (!html) continue;

      const $ = cheerio.load(html);
      let rating: number | null = null;
      let reviewCount: number | null = null;
      const reviews: string[] = [];

      // Method 1: JSON-LD aggregateRating + Review snippets
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const json = JSON.parse($(el).html() || "{}");
          const entries = Array.isArray(json) ? json : [json];
          for (const entry of entries) {
            const e = entry as Record<string, unknown>;
            const ar = (e.aggregateRating ?? (e["@graph"] as Record<string, unknown>[])?.[0]?.aggregateRating) as Record<string, unknown> | undefined;
            if (ar?.ratingValue) {
              rating = parseFloat(String(ar.ratingValue));
              reviewCount = parseInt(String(ar.reviewCount ?? ar.ratingCount ?? "0"), 10) || null;
            }
            // Extract individual review bodies
            if (e["@type"] === "Review" && e.reviewBody) {
              const text = String(e.reviewBody).trim();
              if (text.length > 20 && reviews.length < 5) reviews.push(text.slice(0, 300));
            }
            // @graph array may contain Reviews
            if (Array.isArray(e["@graph"])) {
              for (const node of e["@graph"] as Record<string, unknown>[]) {
                if (node["@type"] === "Review" && node.reviewBody) {
                  const text = String(node.reviewBody).trim();
                  if (text.length > 20 && reviews.length < 5) reviews.push(text.slice(0, 300));
                }
              }
            }
          }
        } catch { /* ignore */ }
      });

      // Method 2: __NEXT_DATA__ (Trustpilot Next.js app)
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (nextDataMatch) {
        try {
          const nextData = JSON.parse(nextDataMatch[1]) as Record<string, unknown>;
          const pageProps = (nextData?.props as Record<string, unknown>)?.pageProps as Record<string, unknown>;
          // Rating from businessUnit
          if (rating === null) {
            const bu = pageProps?.businessUnit as Record<string, unknown> | undefined;
            if (bu?.stars) {
              rating = parseFloat(String(bu.stars));
              reviewCount = parseInt(String(bu.numberOfReviews ?? "0"), 10) || null;
            }
          }
          // Reviews array
          const reviewsData = pageProps?.reviews as Array<Record<string, unknown>> | undefined;
          if (Array.isArray(reviewsData)) {
            for (const r of reviewsData) {
              const text = String(r.text ?? r.content ?? r.reviewBody ?? "").trim();
              if (text.length > 20 && reviews.length < 5) reviews.push(text.slice(0, 300));
            }
          }
        } catch { /* ignore */ }
      }

      // Method 3: HTML meta/regex fallback for rating
      if (rating === null) {
        const ratingMatch = html.match(/"ratingValue"\s*:\s*"?([\d.]+)"?/);
        const countMatch  = html.match(/"reviewCount"\s*:\s*"?(\d+)"?/);
        if (ratingMatch) {
          rating = parseFloat(ratingMatch[1]);
          if (countMatch) reviewCount = parseInt(countMatch[1], 10) || null;
        }
      }

      if (rating !== null) return { rating, reviewCount, reviews };
    } catch { /* try next candidate */ }
  }
  return { rating: null, reviewCount: null, reviews: [] };
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
    // English / US
    [/\b(LLC|L\.L\.C\.?)\b/, "LLC"],
    [/\bInc\.?\b|\bIncorporated\b/, "Inc."],
    [/\bCorp\.?\b|\bCorporation\b/, "Corp."],
    [/\bLtd\.?\b|\bLimited\b/, "Ltd."],
    [/\bCo\.\s+LLC\b|\bCo\.,?\s+Inc\b/, "Co."],
    // German / Austrian / Swiss
    [/\bGmbH\b|\bGmbH\s*&\s*Co\b/, "GmbH"],
    [/\bAG\b|\bAktiengesellschaft\b/, "AG"],
    [/\bKG\b|\bKommanditgesellschaft\b/, "KG"],
    [/\bOHG\b/, "OHG"],
    [/\be\.K\.\b|\be\.Kfm\.\b/, "e.K."],
    // French
    [/\bSAS\b|\bS\.A\.S\.\b/, "SAS"],
    [/\bSARL\b|\bS\.A\.R\.L\.\b/, "SARL"],
    [/\bSA\b|\bS\.A\.\b/, "SA"],
    [/\bEURL\b/, "EURL"],
    [/\bSCI\b/, "SCI"],
    // Spanish / Portuguese
    [/\bS\.L\.\b|\bSociedad\s+Limitada\b/, "S.L."],
    [/\bS\.A\.\b|\bSociedad\s+An[oó]nima\b/, "S.A."],
    [/\bLda\.?\b|\bLimitada\b/, "Lda."],
    [/\bME\b|\bMicroempresa\b/, "ME"],
    // Dutch / Belgian
    [/\bB\.V\.\b|\bBV\b|\bBesloten\s+Vennootschap\b/, "B.V."],
    [/\bN\.V\.\b|\bNV\b|\bNaamloze\s+Vennootschap\b/, "N.V."],
    // Nordic
    [/\bA\/S\b|\bAktieselskab\b|\bAksjeselskap\b/, "A/S"],
    [/\bAB\b|\bAktiebolag\b/, "AB"],
    [/\bOy\b|\bOsakeyhti[oö]\b/, "Oy"],
    // Polish / Czech / Slovak
    [/\bSp\.\s*z\s*o\.o\.\b|\bspółka\s+z\s+ograniczoną\b/i, "Sp. z o.o."],
    [/\bs\.r\.o\.\b|\bspolečnost\s+s\s+ručením/i, "s.r.o."],
    // Asian (very common for Shopify stores shipping from Asia)
    [/\bCo\.,?\s*Ltd\.?\b|\bCo\.,?\s*LTD\.?\b/, "Co., Ltd."],
    [/\bPte\.\s*Ltd\.?\b/, "Pte. Ltd."],
    [/\bPty\.\s*Ltd\.?\b/, "Pty. Ltd."],
    [/\b有限公司\b/, "有限公司"],
    [/\b株式会社\b|\b合同会社\b/, "KK/LLC (JP)"],
    [/\b주식회사\b|\b유한회사\b/, "주식회사 (KR)"],
    [/\bCông\s+ty\b|\bCTCP\b|\bCTTNHH\b/i, "Công ty (VN)"],
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
  return (
    // US/Canada: (123) 456-7890 or +1-800-000-0000
    /(\+1[-.\\s]?)?\(?\d{3}\)?[-.\\s]?\d{3}[-.\\s]?\d{4}/.test(text) ||
    // International with country code: +33 1 23 45 67 89, +84 901 234 567, etc.
    /\+\d{1,3}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/.test(text) ||
    // European format: 06 12 34 56 78, 0612 34 5678
    /\b0\d{1,2}[\s.-]\d{2}[\s.-]\d{2}[\s.-]\d{2}[\s.-]\d{2}\b/.test(text) ||
    // Vietnamese: 090 123 4567, 0901.234.567
    /\b(0[3-9]\d{1})[.\s-]?\d{3}[.\s-]?\d{4}\b/.test(text)
  );
}

function hasAddressPattern(text: string): boolean {
  return (
    // US street address
    /\d{1,5}\s+\w+\s+(st|street|ave|avenue|blvd|boulevard|rd|road|dr|drive|ln|lane|way|ct|court)/i.test(text) ||
    // US/CA zip: 5-digit or ZIP+4
    /\b[A-Z]{2}\s+\d{5}(-\d{4})?\b/.test(text) ||
    // European postal code (DE: 12345, FR: 75001, NL: 1234 AB, UK: SW1A 1AA)
    /\b\d{4,5}\s+[A-Z][a-z]|\b[A-Z]{1,2}\d{1,2}\s*\d[A-Z]{2}\b/.test(text) ||
    // City + country patterns common in legal pages
    /Albuquerque|New Mexico|New York|Los Angeles|London|Paris|Berlin|Amsterdam/i.test(text) ||
    // Vietnamese address patterns
    /(?:phường|quận|huyện|tỉnh|thành phố|đường|số)\s+\w/i.test(text) ||
    // Generic: number + street-like word in multiple languages
    /\d+[,\s]+(rue|avenue|boulevard|strasse|straße|via|calle|rua|đường|路|街)\s+/i.test(text)
  );
}

function extractSocialLinks($: cheerio.CheerioAPI, html?: string): string[] {
  const platforms: [string, string][] = [
    ["facebook.com", "facebook"],
    ["instagram.com", "instagram"],
    ["twitter.com", "twitter"],
    ["x.com/", "twitter"],
    ["tiktok.com", "tiktok"],
    ["youtube.com", "youtube"],
    ["pinterest.com", "pinterest"],
    ["linkedin.com", "linkedin"],
    ["snapchat.com", "snapchat"],
  ];
  const found = new Set<string>();

  // Method 1: anchor hrefs
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    for (const [pattern, label] of platforms) {
      if (href.includes(pattern)) { found.add(label); break; }
    }
  });

  // Method 2: raw HTML scan (catches JS-injected or SVG icon links)
  if (html) {
    for (const [pattern, label] of platforms) {
      if (html.includes(pattern)) found.add(label);
    }
    // og:see_also meta
    const seeAlsoMatches = html.matchAll(/property=["']og:see_also["'][^>]*content=["']([^"']+)/gi);
    for (const m of seeAlsoMatches) {
      for (const [pattern, label] of platforms) {
        if (m[1].includes(pattern)) found.add(label);
      }
    }
  }

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
  // Founded/established patterns — multilingual
  if (/founded|established|since\s+\d{4}|started\s+in|gegründet|fondé|fundad[ao]|fondato|opgericht|基立|設立|창립|thành lập/i.test(text)) score++;
  // Team/mission patterns — multilingual
  if (/team|staff|founder|owner|mission|values|story|family|équipe|gründer|equipo|fundador|squadra|團隊|团队|チーム|팀|đội ngũ/i.test(text)) score++;
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
    // French long-distance signals
    "livraison en 3", "livraison en 4", "livraison en 5", "livraison en 6",
    "jours ouvrés", "jours ouvrables", "semaines",
    // German
    "werktage", "wochen",
    // Spanish
    "días hábiles", "semanas",
    // Vietnamese
    "ngày làm việc",
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
  product_type?: string;
  variants: Array<{ price: string }>;
  images: Array<{ src: string }>;
}

// Keywords that indicate a non-physical / service item (shipping upsells, warranties, etc.)
const NON_PRODUCT_RE =
  /\b(shipping|expedited|priority\s+processing|priority\s+mail|protection\s+plan|warranty|insurance|gift\s+(card|wrap|certificate)|donation|tip|handling\s+fee|rush\s+order|express\s+delivery|delivery\s+upgrade|upsell|add-?on|fragile|route\s+protection)\b/i;

function isNonPhysicalProduct(title: string, productType?: string): boolean {
  if (NON_PRODUCT_RE.test(title)) return true;
  if (productType && /^(shipping|service|upsell|insurance)/i.test(productType)) return true;
  return false;
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
    // Fetch extra products so we still have 4-6 after filtering out non-physical items
    const res = await fetch(`${baseUrl}/products.json?limit=12`, {
      headers: US_HEADERS,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json() as { products: ShopifyProductJson[] };
    const physical: ScrapedProduct[] = [];
    for (const p of data.products ?? []) {
      if (physical.length >= 6) break;
      if (!p.title || isNonPhysicalProduct(p.title, p.product_type)) continue;
      const rawPrice = p.variants?.[0]?.price;
      if (!rawPrice) continue;
      const num = parseFloat(rawPrice);
      if (isNaN(num)) continue;
      physical.push({
        name: p.title,
        price: formatPrice(num, currency),
        priceNumeric: num,
        priceUsd: toUsd(num, currency),
        image: p.images?.[0]?.src ?? null,
        url: `${baseUrl}/products/${p.handle}`,
        currency,
      });
    }
    return physical;
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
    trustpilotReviews: [],
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

  // Social links — scan both parsed DOM and raw HTML
  base.socialLinks = extractSocialLinks($, mainHtml);
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

  // ── Multilingual policy link keywords ──────────────────────────────────────
  // Covers EN, FR, DE, ES, PT, VI, ZH, JA, KO, NL, IT, PL
  const KW_RETURN = [
    // EN
    "return", "refund",
    // FR
    "retour", "remboursement",
    // DE
    "ruckgabe", "rücksendung", "widerruf",
    // ES
    "devolucion", "devolución", "reembolso",
    // PT
    "devolucao", "devolução",
    // VI
    "doi-tra", "hoan-tien", "chinh-sach-doi",
    // ZH
    "退换", "退款", "退货",
    // JA
    "返品", "返金",
    // KO
    "반품", "환불",
    // IT
    "reso", "rimborso", "restituzione",
    // PL
    "zwrot",
    // NL
    "terugsturen",
  ];
  const KW_PRIVACY = [
    "privacy",
    "confidentialite", "confidentialité",   // FR
    "datenschutz",                           // DE
    "privacidad",                            // ES
    "privacidade",                           // PT
    "bao-mat", "bảo-mật",                   // VI
    "隐私", "隱私", "個人情報", "개인정보",    // ZH/JA/KO
    "riservatezza",                          // IT
    "prywatnosc",                            // PL
  ];
  const KW_TERMS = [
    "terms", "conditions", "tos",
    "cgv", "mentions-legales", "conditions-generales",  // FR
    "agb", "nutzungsbedingungen",                       // DE
    "terminos", "términos", "condiciones",              // ES
    "termos", "condicoes",                              // PT
    "dieu-khoan", "điều-khoản",                         // VI
    "条款", "條款", "利用規約", "이용약관",               // ZH/JA/KO
    "voorwaarden",                                      // NL
    "regolamento", "termini",                           // IT
    "regulamin",                                        // PL
  ];
  const KW_CONTACT = [
    "contact", "support", "help", "customer-service", "customer-care",
    "assistance", "aide",                   // FR
    "kontakt", "hilfe",                     // DE
    "contacto", "ayuda",                    // ES
    "contato", "ajuda",                     // PT
    "lien-he", "ho-tro",                    // VI
    "联系", "聯繫", "客服", "お問い合わせ", "문의",  // ZH/JA/KO
    "hulp",                                 // NL
    "contatto", "aiuto",                    // IT
    "pomoc",                                // PL
  ];
  const KW_SHIPPING = [
    "shipping", "delivery", "dispatch",
    "livraison", "expedition", "expédition",  // FR
    "versand", "lieferung",                   // DE
    "envio", "envío", "entrega",              // ES
    "frete",                                  // PT
    "van-chuyen", "giao-hang",               // VI
    "运费", "配送", "快递", "配送", "発送", "배송",  // ZH/JA/KO
    "verzending", "levering",                 // NL
    "spedizione", "consegna",                 // IT
    "wysylka", "dostawa",                     // PL
  ];
  const KW_ABOUT = [
    "about", "our-story", "who-we-are", "our-brand",
    "a-propos", "qui-sommes-nous", "notre-histoire",  // FR
    "uber-uns", "über-uns",                           // DE
    "sobre-nosotros", "quienes-somos",                // ES
    "sobre-nos", "quem-somos",                        // PT
    "ve-chung-toi", "gioi-thieu",                     // VI
    "关于我们", "關於我們", "会社概要", "회사소개",       // ZH/JA/KO
    "over-ons",                                       // NL
    "chi-siamo",                                      // IT
    "o-nas",                                          // PL
  ];

  const returnUrl  = findLinks($, baseUrl, KW_RETURN);
  const privacyUrl = findLinks($, baseUrl, KW_PRIVACY);
  const termsUrl   = findLinks($, baseUrl, KW_TERMS);
  const contactUrl = findLinks($, baseUrl, KW_CONTACT);
  const shippingUrl = findLinks($, baseUrl, KW_SHIPPING);
  const aboutUrl   = findLinks($, baseUrl, KW_ABOUT);

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
  base.trustpilotReviews = trustpilot.reviews;
  base.domainAgeDays = domainAge.ageDays;
  base.domainCreatedAt = domainAge.createdAt;

  if (returnHtml) {
    base.hasReturnPolicy = true;
    const $r = cheerio.load(returnHtml);
    base.returnPolicyText = $r("body").text().replace(/\s+/g, " ").trim().slice(0, 2000);
  } else {
    // Check if content exists on main page itself — multilingual
    const bodyText = mainText.toLowerCase();
    const returnSignals = [
      "return policy", "refund policy",
      "politique de retour", "politique de remboursement",  // FR
      "rückgaberecht", "rückgabebedingungen", "widerruf",   // DE
      "política de devolución", "política de reembolso",    // ES
      "política de devolução",                              // PT
      "chính sách đổi trả", "chính sách hoàn tiền",        // VI
      "退换政策", "退款政策", "返品ポリシー", "반품 정책",   // ZH/JA/KO
    ];
    if (returnSignals.some(s => bodyText.includes(s))) {
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
    const originResult = detectShippingOrigin(shippingText);
    base.shipsFromUS = originResult.shipsFromUS;
    base.shippingOriginSignals = originResult.signals;
  } else {
    // Detect from main page text — multilingual policy keywords
    const bodyText = mainText.toLowerCase();
    const shippingPolicySignals = [
      "shipping policy", "shipping information", "delivery policy",
      "politique de livraison", "politique d'expédition",
      "versandrichtlinien", "versandinformation",
      "política de envío", "información de envío",
      "política de envio", "informações de envio",
      "chính sách vận chuyển", "chính sách giao hàng",
      "运费政策", "配送ポリシー", "배송 정책",
    ];
    // Also detect if main page contains actual delivery timeframe content
    const deliveryContentSignals = [
      // EN
      /delivers?\s+in\s+\d|ships?\s+in\s+\d|arrives?\s+in\s+\d|estimated\s+delivery/i,
      // FR — "livraison en X jours", "livraison rapide", "jours ouvrés"
      /livraison\s+(rapide|gratuite|express|en\s+\d|standard)/i,
      /\d+\s*(à|-)\s*\d+\s*jours?\s*(ouvrés?|ouvrables?|calendaires?)/i,
      // DE
      /lieferung\s+in\s+\d|versand\s+in\s+\d|\d+\s*-\s*\d+\s*werktage/i,
      // ES
      /entrega\s+en\s+\d|\d+\s*(a|-)\s*\d+\s*días?\s*hábiles/i,
      // PT
      /entrega\s+em\s+\d|\d+\s*(a|-)\s*\d+\s*dias?\s*úteis/i,
      // VI
      /giao\s+hàng\s+trong\s+\d|\d+\s*-\s*\d+\s*ngày\s*làm\s*việc/i,
      // Generic: "X-Y business days", "X-Y days delivery"
      /\d+\s*[-–]\s*\d+\s*(business\s+days?|working\s+days?|days?\s+delivery)/i,
    ];
    if (
      shippingPolicySignals.some(s => bodyText.includes(s)) ||
      deliveryContentSignals.some(r => r.test(mainText))
    ) {
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
    const extraMethods = detectPaymentMethods(aboutHtml);
    base.paymentMethods = Array.from(new Set([...base.paymentMethods, ...extraMethods]));
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

  // Scan legal/terms/privacy pages for business registration info (e.g. French "Mentions légales")
  const legalPagesText = [termsHtml, privacyHtml]
    .filter(Boolean)
    .map(html => {
      const $p = cheerio.load(html!);
      return $p("body").text();
    })
    .join(" ");
  if (legalPagesText.length > 0) {
    if (!base.hasBusinessRegistration) {
      const bizReg = detectBusinessRegistration(legalPagesText);
      if (bizReg.found) {
        base.hasBusinessRegistration = true;
        base.businessEntityType = bizReg.entityType;
      }
    }
    if (!base.contactEmail) {
      const emailFromLegal = extractEmail(legalPagesText);
      if (emailFromLegal) {
        base.contactEmail = emailFromLegal;
        base.hasEmailAddress = true;
      }
    }
    if (!base.hasAddress) base.hasAddress = hasAddressPattern(legalPagesText);
    if (!base.hasPhoneNumber) base.hasPhoneNumber = hasPhonePattern(legalPagesText);
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
