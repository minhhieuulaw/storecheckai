export type Verdict = "BUY" | "CAUTION" | "SKIP";
export type PriceVerdict = "fair" | "cheap" | "overpriced" | "marked_up";

export interface ScrapedProduct {
  name: string;
  price: string | null;       // formatted string with currency symbol
  priceNumeric: number | null; // raw numeric value in original currency
  priceUsd: number | null;    // approximate USD equivalent (null if already USD)
  image: string | null;
  url: string | null;
  currency: string;
}

export interface PriceAnalysis {
  productName: string;
  storePrice: string;
  identifiedAs: string;
  estimatedMarketPrice: string;  // Amazon retail range (primary reference)
  aliexpressPrice: string | null; // AliExpress wholesale/dropship range
  temuPrice: string | null;      // Temu price range reference
  markupNote: string | null;     // e.g. "~2x Amazon price"
  priceVerdict: PriceVerdict;
  explanation: string;
  imageUrl: string | null;
  googleLensUrl: string | null;
  amazonSearchUrl: string;
  aliexpressSearchUrl: string;
  temuSearchUrl: string;
}
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type SignalStatus = "pass" | "warn" | "fail" | "unknown";
export type ReviewConfidence = "LOW" | "MODERATE" | "HIGH" | "UNKNOWN";

export interface StoreSignal {
  name: string;
  status: SignalStatus;
  detail: string;
  points: number;
}

export interface SecurityHeaders {
  hsts: boolean;
  xFrameOptions: boolean;
  csp: boolean;
  xContentTypeOptions: boolean;
}

export interface ScrapedData {
  url: string;
  domain: string;
  isHttps: boolean;
  pageTitle: string;
  hasContactPage: boolean;
  hasPrivacyPolicy: boolean;
  hasReturnPolicy: boolean;
  hasTermsOfService: boolean;
  hasPhoneNumber: boolean;
  hasEmailAddress: boolean;
  hasAddress: boolean;
  hasSocialLinks: boolean;
  socialLinks: string[];
  contactEmail: string | null;
  returnPolicyText: string | null;
  aboutText: string | null;
  isShopify: boolean;
  ogImage: string | null;
  ogDescription: string | null;
  domainAgeDays: number | null;
  domainCreatedAt: string | null;
  // Tier 1 additions
  hasShippingPolicy: boolean;
  shippingPolicyText: string | null;
  paymentMethods: string[];
  emailDomainMatch: boolean | null;
  hasAboutPage: boolean;
  aboutQualityScore: number;
  securityHeaders: SecurityHeaders;
  shipsFromUS: boolean | null;
  shippingOriginSignals: string[];
  // Products
  products: ScrapedProduct[];
  // Tier 2 additions
  trustpilotRating: number | null;
  trustpilotReviewCount: number | null;
  trustpilotReviews: string[];          // top review snippets (max 5)
  manipulationTactics: string[];
  hasCookieConsent: boolean;
  hasBusinessRegistration: boolean;
  businessEntityType: string | null;
  hasSiteReviews: boolean;
  reviewPlatforms: string[];
  redirectsToNewDomain: boolean;
  scrapeError?: string;
}

export interface Report {
  id: string;
  userId?: string;
  planUsed?: string;
  url: string;
  domain: string;
  storeName: string;
  analyzedAt: string;

  // Scores
  trustScore: number;
  returnRisk: RiskLevel;
  reviewConfidence: ReviewConfidence;
  verdict: Verdict;

  // Content
  verdictReason: string;
  pros: string[];
  cons: string[];
  complaints: string[];
  storeSignals: StoreSignal[];
  redFlags: string[];
  returnSummary: string;
  suspiciousSignals: string[];
  whoShouldBuy: string;
  whoShouldAvoid: string;
  finalTake: string;

  // Products & price comparison
  products: ScrapedProduct[];
  priceAnalysis: PriceAnalysis[];
  // Extra data for display
  paymentMethods: string[];
  shippingOriginSignals: string[];
  trustpilotRating: number | null;
  trustpilotReviewCount: number | null;
  trustpilotReviews: string[];
  manipulationTactics: string[];
  reviewPlatforms: string[];

  // Risk signals
  nonDeliveryRisk: boolean;
  scamPatterns: string[];

  // Meta
  ogImage: string | null;
  isPartialData: boolean;
  scrapeError?: string;
}

export interface AnalyzeRequest {
  url: string;
}

export interface AnalyzeResponse {
  success: boolean;
  reportId?: string;
  report?: Report;
  error?: string;
}
