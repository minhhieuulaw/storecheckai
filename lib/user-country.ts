/**
 * User Country Detection
 *
 * Detects a user's country from request headers (CDN-provided or Accept-Language).
 * Returns ISO 3166-1 alpha-2 country codes (US, GB, DE, VN, etc.)
 *
 * Resolution order:
 *   1. Cloudflare: CF-IPCountry
 *   2. Vercel: x-vercel-ip-country
 *   3. Nginx x-real-ip with MaxMind lookup (not implemented — optional)
 *   4. Accept-Language header fallback (e.g. "vi-VN,vi;q=0.9" → VN)
 *   5. Default: US
 */
import type { NextRequest } from "next/server";

export type CountryCode = string; // 2-letter ISO code

// Locale → Country map for Accept-Language fallback
const LOCALE_TO_COUNTRY: Record<string, string> = {
  "en-us": "US", "en-gb": "GB", "en-ca": "CA", "en-au": "AU",
  "vi-vn": "VN", "vi": "VN",
  "de-de": "DE", "de": "DE", "de-at": "AT", "de-ch": "CH",
  "fr-fr": "FR", "fr": "FR", "fr-ca": "CA", "fr-be": "BE",
  "es-es": "ES", "es": "ES", "es-mx": "MX", "es-ar": "AR",
  "pt-br": "BR", "pt-pt": "PT",
  "it-it": "IT", "it": "IT",
  "ja-jp": "JP", "ja": "JP",
  "ko-kr": "KR", "ko": "KR",
  "zh-cn": "CN", "zh-hk": "HK", "zh-tw": "TW", "zh": "CN",
  "ru-ru": "RU", "ru": "RU",
  "th-th": "TH", "id-id": "ID", "ms-my": "MY", "tl-ph": "PH",
  "nl-nl": "NL", "nl": "NL", "sv-se": "SE", "da-dk": "DK", "no-no": "NO", "fi-fi": "FI",
  "pl-pl": "PL", "tr-tr": "TR", "el-gr": "GR", "cs-cz": "CZ",
  "he-il": "IL", "ar-sa": "SA", "ar-ae": "AE", "hi-in": "IN",
};

/**
 * Detect country code from Next.js request.
 * Falls back to "US" if no signal available.
 */
export function detectUserCountry(req: NextRequest | Request): CountryCode {
  const headers = "headers" in req ? req.headers : new Headers();

  // 1. Cloudflare
  const cfCountry = headers.get("cf-ipcountry");
  if (cfCountry && cfCountry.length === 2 && cfCountry !== "XX") {
    return cfCountry.toUpperCase();
  }

  // 2. Vercel
  const vercelCountry = headers.get("x-vercel-ip-country");
  if (vercelCountry && vercelCountry.length === 2) {
    return vercelCountry.toUpperCase();
  }

  // 3. Cloudfront / other CDNs
  const cloudfrontCountry = headers.get("cloudfront-viewer-country");
  if (cloudfrontCountry && cloudfrontCountry.length === 2) {
    return cloudfrontCountry.toUpperCase();
  }

  // 4. Accept-Language fallback (best-effort)
  const acceptLang = headers.get("accept-language");
  if (acceptLang) {
    const parts = acceptLang.toLowerCase().split(",")[0].trim();
    if (parts && LOCALE_TO_COUNTRY[parts]) return LOCALE_TO_COUNTRY[parts];
    // Try just the language prefix (e.g. "en" from "en;q=0.9")
    const lang = parts.split(";")[0].trim();
    if (LOCALE_TO_COUNTRY[lang]) return LOCALE_TO_COUNTRY[lang];
  }

  // 5. Default
  return "US";
}

// ─── Amazon Marketplace Mapping ─────────────────────────────────────────────

/**
 * Map country code to the appropriate Amazon marketplace config.
 * For countries without a local Amazon store, falls back to amazon.com with ship-to.
 */
export interface AmazonMarketplace {
  domain: string;           // e.g. "www.amazon.com"
  currency: string;         // e.g. "USD"
  locale: string;           // e.g. "en_US"
  spCdn: string;            // e.g. "L5Z9:US" — Amazon edge routing cookie
  shipToCountryCode: string; // 2-letter ISO for ship-to
}

const AMAZON_MARKETPLACES: Record<string, AmazonMarketplace> = {
  US: { domain: "www.amazon.com",     currency: "USD", locale: "en_US", spCdn: "L5Z9:US", shipToCountryCode: "US" },
  GB: { domain: "www.amazon.co.uk",   currency: "GBP", locale: "en_GB", spCdn: "",        shipToCountryCode: "GB" },
  DE: { domain: "www.amazon.de",      currency: "EUR", locale: "de_DE", spCdn: "",        shipToCountryCode: "DE" },
  FR: { domain: "www.amazon.fr",      currency: "EUR", locale: "fr_FR", spCdn: "",        shipToCountryCode: "FR" },
  IT: { domain: "www.amazon.it",      currency: "EUR", locale: "it_IT", spCdn: "",        shipToCountryCode: "IT" },
  ES: { domain: "www.amazon.es",      currency: "EUR", locale: "es_ES", spCdn: "",        shipToCountryCode: "ES" },
  CA: { domain: "www.amazon.ca",      currency: "CAD", locale: "en_CA", spCdn: "",        shipToCountryCode: "CA" },
  AU: { domain: "www.amazon.com.au",  currency: "AUD", locale: "en_AU", spCdn: "",        shipToCountryCode: "AU" },
  JP: { domain: "www.amazon.co.jp",   currency: "JPY", locale: "ja_JP", spCdn: "",        shipToCountryCode: "JP" },
  IN: { domain: "www.amazon.in",      currency: "INR", locale: "en_IN", spCdn: "",        shipToCountryCode: "IN" },
  NL: { domain: "www.amazon.nl",      currency: "EUR", locale: "nl_NL", spCdn: "",        shipToCountryCode: "NL" },
  SG: { domain: "www.amazon.sg",      currency: "SGD", locale: "en_SG", spCdn: "",        shipToCountryCode: "SG" },
  MX: { domain: "www.amazon.com.mx",  currency: "MXN", locale: "es_MX", spCdn: "",        shipToCountryCode: "MX" },
  BR: { domain: "www.amazon.com.br",  currency: "BRL", locale: "pt_BR", spCdn: "",        shipToCountryCode: "BR" },
};

export function getAmazonMarketplace(countryCode: CountryCode): AmazonMarketplace {
  // Direct match — country has local Amazon
  if (AMAZON_MARKETPLACES[countryCode]) {
    return AMAZON_MARKETPLACES[countryCode];
  }
  // Fallback: amazon.com with ship-to country header
  // (works for VN, TH, ID, etc. — Amazon Global ships to most countries)
  return {
    ...AMAZON_MARKETPLACES.US,
    shipToCountryCode: countryCode,
  };
}

// ─── AliExpress Country Mapping ─────────────────────────────────────────────

export interface AliExpressCountryConfig {
  region: string;     // e.g. "US", "GB", "DE"
  currency: string;   // e.g. "USD", "GBP", "EUR"
  locale: string;     // e.g. "en_US"
}

const ALI_COUNTRY_CONFIG: Record<string, AliExpressCountryConfig> = {
  US: { region: "US", currency: "USD", locale: "en_US" },
  GB: { region: "GB", currency: "GBP", locale: "en_GB" },
  DE: { region: "DE", currency: "EUR", locale: "de_DE" },
  FR: { region: "FR", currency: "EUR", locale: "fr_FR" },
  IT: { region: "IT", currency: "EUR", locale: "it_IT" },
  ES: { region: "ES", currency: "EUR", locale: "es_ES" },
  CA: { region: "CA", currency: "CAD", locale: "en_CA" },
  AU: { region: "AU", currency: "AUD", locale: "en_AU" },
  JP: { region: "JP", currency: "JPY", locale: "ja_JP" },
  KR: { region: "KR", currency: "KRW", locale: "ko_KR" },
  RU: { region: "RU", currency: "RUB", locale: "ru_RU" },
  BR: { region: "BR", currency: "BRL", locale: "pt_BR" },
  MX: { region: "MX", currency: "MXN", locale: "es_MX" },
  IN: { region: "IN", currency: "INR", locale: "en_IN" },
  NL: { region: "NL", currency: "EUR", locale: "nl_NL" },
  PL: { region: "PL", currency: "PLN", locale: "pl_PL" },
  VN: { region: "VN", currency: "USD", locale: "en_US" }, // VN uses USD on Ali
  TH: { region: "TH", currency: "USD", locale: "en_US" },
  SG: { region: "SG", currency: "SGD", locale: "en_SG" },
  ID: { region: "ID", currency: "USD", locale: "en_US" },
  PH: { region: "PH", currency: "USD", locale: "en_US" },
  MY: { region: "MY", currency: "MYR", locale: "en_MY" },
};

export function getAliExpressConfig(countryCode: CountryCode): AliExpressCountryConfig {
  return ALI_COUNTRY_CONFIG[countryCode] ?? ALI_COUNTRY_CONFIG.US;
}

// ─── Country Display Names (for UI text) ────────────────────────────────────

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", GB: "United Kingdom", DE: "Germany", FR: "France",
  IT: "Italy", ES: "Spain", CA: "Canada", AU: "Australia", JP: "Japan",
  IN: "India", NL: "Netherlands", SG: "Singapore", MX: "Mexico", BR: "Brazil",
  VN: "Vietnam", TH: "Thailand", ID: "Indonesia", PH: "Philippines", MY: "Malaysia",
  KR: "South Korea", RU: "Russia", PL: "Poland", TR: "Turkey", SE: "Sweden",
  DK: "Denmark", NO: "Norway", FI: "Finland", BE: "Belgium", CH: "Switzerland",
  AT: "Austria", IE: "Ireland", NZ: "New Zealand", IL: "Israel", SA: "Saudi Arabia",
  AE: "UAE", ZA: "South Africa", EG: "Egypt", CN: "China", HK: "Hong Kong", TW: "Taiwan",
};

export function getCountryName(countryCode: CountryCode): string {
  return COUNTRY_NAMES[countryCode] ?? countryCode;
}
