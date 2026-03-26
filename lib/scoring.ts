import type { ScrapedData, StoreSignal, RiskLevel } from "./types";

export interface ScoringResult {
  trustScore: number;
  signals: StoreSignal[];
}

const MAX_POINTS = 123; // 85 base + 20 Tier 1 + 18 Tier 2

export function calculateTrustScore(data: ScrapedData): ScoringResult {
  const signals: StoreSignal[] = [];
  let raw = 0;

  // --- SECURITY (10pts) ---
  if (data.isHttps) {
    signals.push({ name: "HTTPS Secure", status: "pass", detail: "Site uses HTTPS encryption", points: 10 });
    raw += 10;
  } else {
    signals.push({ name: "HTTPS Secure", status: "fail", detail: "No HTTPS — avoid entering payment info on this site", points: 0 });
  }

  // --- SECURITY HEADERS (5pts) ---
  const sh = data.securityHeaders;
  const headerCount = [sh.hsts, sh.xFrameOptions, sh.csp, sh.xContentTypeOptions].filter(Boolean).length;
  const headerList = [
    sh.hsts && "HSTS",
    sh.xFrameOptions && "X-Frame-Options",
    sh.csp && "CSP",
    sh.xContentTypeOptions && "X-Content-Type",
  ].filter(Boolean).join(", ");

  if (headerCount >= 3) {
    signals.push({ name: "Security Headers", status: "pass", detail: `${headerCount}/4 security headers present: ${headerList}`, points: 5 });
    raw += 5;
  } else if (headerCount >= 1) {
    signals.push({ name: "Security Headers", status: "warn", detail: `Only ${headerCount}/4 security headers: ${headerList || "none detected"}`, points: 2 });
    raw += 2;
  } else {
    signals.push({ name: "Security Headers", status: "warn", detail: "No security headers detected (HSTS, CSP, etc.)", points: 0 });
  }

  // --- POLICIES (28pts) ---
  if (data.hasReturnPolicy) {
    signals.push({ name: "Return Policy", status: "pass", detail: "Return/refund policy page exists", points: 10 });
    raw += 10;
  } else {
    signals.push({ name: "Return Policy", status: "fail", detail: "No return policy found — high risk if you need to return", points: 0 });
  }

  if (data.hasPrivacyPolicy) {
    signals.push({ name: "Privacy Policy", status: "pass", detail: "Privacy policy page found", points: 8 });
    raw += 8;
  } else {
    signals.push({ name: "Privacy Policy", status: "warn", detail: "No privacy policy — legally required in most US states", points: 0 });
  }

  if (data.hasTermsOfService) {
    signals.push({ name: "Terms of Service", status: "pass", detail: "Terms of service page found", points: 5 });
    raw += 5;
  } else {
    signals.push({ name: "Terms of Service", status: "warn", detail: "No terms of service found", points: 0 });
  }

  if (data.hasContactPage) {
    signals.push({ name: "Contact Page", status: "pass", detail: "Dedicated contact page exists", points: 5 });
    raw += 5;
  } else {
    signals.push({ name: "Contact Page", status: "warn", detail: "No contact page found", points: 0 });
  }

  // --- SHIPPING POLICY (5pts) ---
  if (data.hasShippingPolicy) {
    const shipsNote = data.shipsFromUS === true ? " — ships from US" : data.shipsFromUS === false ? " — possible overseas fulfillment" : "";
    signals.push({ name: "Shipping Policy", status: "pass", detail: `Shipping policy found${shipsNote}`, points: 5 });
    raw += 5;
  } else {
    signals.push({ name: "Shipping Policy", status: "warn", detail: "No shipping policy found — delivery timeframes unknown", points: 0 });
  }

  // --- CONTACT INFO (22pts) ---
  if (data.hasEmailAddress) {
    const isBusinessEmail =
      data.contactEmail && !data.contactEmail.includes("gmail") && !data.contactEmail.includes("yahoo") && !data.contactEmail.includes("hotmail");
    if (isBusinessEmail) {
      const domainNote = data.emailDomainMatch === true ? " (matches store domain)" : data.emailDomainMatch === false ? " (different domain)" : "";
      signals.push({ name: "Business Email", status: "pass", detail: `Business email found: ${data.contactEmail}${domainNote}`, points: 8 });
      raw += 8;
    } else {
      signals.push({ name: "Contact Email", status: "warn", detail: `Personal email found: ${data.contactEmail} — prefer business email`, points: 4 });
      raw += 4;
    }
  } else {
    signals.push({ name: "Contact Email", status: "fail", detail: "No contact email found", points: 0 });
  }

  if (data.hasPhoneNumber) {
    signals.push({ name: "Phone Number", status: "pass", detail: "Phone number listed on site", points: 7 });
    raw += 7;
  } else {
    signals.push({ name: "Phone Number", status: "warn", detail: "No phone number found", points: 0 });
  }

  if (data.hasAddress) {
    signals.push({ name: "Physical Address", status: "pass", detail: "Physical address listed", points: 7 });
    raw += 7;
  } else {
    signals.push({ name: "Physical Address", status: "warn", detail: "No physical address listed", points: 0 });
  }

  // --- ABOUT PAGE (5pts) ---
  if (!data.hasAboutPage) {
    signals.push({ name: "About Page", status: "warn", detail: "No about page found — harder to verify store identity", points: 0 });
  } else if (data.aboutQualityScore >= 3) {
    signals.push({ name: "About Page", status: "pass", detail: "Detailed about page with store history/team info", points: 5 });
    raw += 5;
  } else {
    signals.push({ name: "About Page", status: "warn", detail: "About page exists but content is minimal", points: 2 });
    raw += 2;
  }

  // --- PAYMENT METHODS (5pts) ---
  const pm = data.paymentMethods;
  if (pm.length >= 3) {
    signals.push({ name: "Payment Methods", status: "pass", detail: `${pm.length} payment options detected: ${pm.slice(0, 4).join(", ")}`, points: 5 });
    raw += 5;
  } else if (pm.length >= 1) {
    signals.push({ name: "Payment Methods", status: "warn", detail: `${pm.length} payment method(s) detected: ${pm.join(", ")}`, points: 2 });
    raw += 2;
  } else {
    signals.push({ name: "Payment Methods", status: "warn", detail: "No recognized payment methods detected in page source", points: 0 });
  }

  // --- DOMAIN AGE (0–15pts) ---
  if (data.domainAgeDays === null) {
    signals.push({ name: "Domain Age", status: "unknown", detail: "Could not determine domain registration date", points: 0 });
  } else {
    const days = data.domainAgeDays;
    const years = (days / 365).toFixed(1);
    const label = days < 90 ? `${days} days old` : days < 365 ? `${Math.floor(days / 30)} months old` : `${years} years old`;

    if (days < 90) {
      signals.push({ name: "Domain Age", status: "fail", detail: `Domain is only ${label} — very new, high caution advised`, points: 0 });
    } else if (days < 180) {
      signals.push({ name: "Domain Age", status: "warn", detail: `Domain is ${label} — relatively new`, points: 2 });
      raw += 2;
    } else if (days < 365) {
      signals.push({ name: "Domain Age", status: "warn", detail: `Domain is ${label} — less than 1 year old`, points: 5 });
      raw += 5;
    } else if (days < 730) {
      signals.push({ name: "Domain Age", status: "pass", detail: `Domain is ${label} old`, points: 8 });
      raw += 8;
    } else if (days < 1825) {
      signals.push({ name: "Domain Age", status: "pass", detail: `Domain is ${label} old`, points: 12 });
      raw += 12;
    } else {
      signals.push({ name: "Domain Age", status: "pass", detail: `Domain is ${label} old — well-established`, points: 15 });
      raw += 15;
    }
  }

  // --- TIER 2 SIGNALS ---

  // Trustpilot (0–8pts)
  if (data.trustpilotRating === null) {
    signals.push({ name: "Trustpilot", status: "unknown", detail: "No Trustpilot listing found for this domain", points: 0 });
  } else {
    const r = data.trustpilotRating;
    const count = data.trustpilotReviewCount ?? 0;
    const label = `${r.toFixed(1)}/5 stars (${count.toLocaleString()} reviews)`;
    if (r >= 4.0 && count >= 50) {
      signals.push({ name: "Trustpilot", status: "pass", detail: label, points: 8 });
      raw += 8;
    } else if (r >= 3.5 && count >= 10) {
      signals.push({ name: "Trustpilot", status: "warn", detail: label, points: 5 });
      raw += 5;
    } else if (r >= 3.0) {
      signals.push({ name: "Trustpilot", status: "warn", detail: `Low rating on Trustpilot: ${label}`, points: 2 });
      raw += 2;
    } else {
      signals.push({ name: "Trustpilot", status: "fail", detail: `Poor Trustpilot rating: ${label}`, points: 0 });
    }
  }

  // Business registration (0–5pts)
  if (data.hasBusinessRegistration) {
    signals.push({ name: "Business Registration", status: "pass", detail: `Registered business entity found (${data.businessEntityType})`, points: 5 });
    raw += 5;
  } else {
    signals.push({ name: "Business Registration", status: "warn", detail: "No LLC/Inc/Corp entity mentioned — harder to verify legitimacy", points: 0 });
  }

  // On-site reviews (0–3pts)
  if (data.hasSiteReviews) {
    signals.push({ name: "Customer Reviews", status: "pass", detail: `Review platform detected: ${data.reviewPlatforms.join(", ")}`, points: 3 });
    raw += 3;
  } else {
    signals.push({ name: "Customer Reviews", status: "warn", detail: "No recognized review platform found on site", points: 0 });
  }

  // Cookie consent (0–2pts)
  if (data.hasCookieConsent) {
    signals.push({ name: "Cookie Consent", status: "pass", detail: "GDPR/CCPA cookie consent widget detected", points: 2 });
    raw += 2;
  } else {
    signals.push({ name: "Cookie Consent", status: "warn", detail: "No cookie consent banner detected", points: 0 });
  }

  // Manipulation tactics (flag only, no points)
  if (data.manipulationTactics.length > 0) {
    signals.push({ name: "Dark Patterns", status: "fail", detail: `${data.manipulationTactics.length} manipulation tactic(s): ${data.manipulationTactics[0]}`, points: 0 });
  }

  // Domain redirect (flag only)
  if (data.redirectsToNewDomain) {
    signals.push({ name: "Domain Redirect", status: "fail", detail: "URL redirects to a different domain — verify you're on the right site", points: 0 });
  }

  // --- SOCIAL PRESENCE (10pts) ---
  if (data.hasSocialLinks && data.socialLinks.length >= 2) {
    signals.push({ name: "Social Presence", status: "pass", detail: `${data.socialLinks.length} social links found`, points: 10 });
    raw += 10;
  } else if (data.hasSocialLinks && data.socialLinks.length === 1) {
    signals.push({ name: "Social Presence", status: "warn", detail: "Only 1 social link found", points: 5 });
    raw += 5;
  } else {
    signals.push({ name: "Social Presence", status: "warn", detail: "No social media links found", points: 0 });
  }

  // Normalize to 100
  let trustScore = Math.min(100, Math.round((raw / MAX_POINTS) * 100));

  // ── POST-NORMALIZATION PENALTIES (applied after base score) ──────────────
  // Bad Trustpilot with enough reviews is a strong real-world signal.
  // These deductions override the optimistic technical-signals score.
  if (data.trustpilotRating !== null) {
    const r     = data.trustpilotRating;
    const count = data.trustpilotReviewCount ?? 0;
    if (count >= 3) {
      let deduction = 0;
      if      (r < 2.0) deduction = 32;
      else if (r < 2.5) deduction = 24;
      else if (r < 3.0) deduction = 16;
      else if (r < 3.5) deduction = 6;
      if (deduction > 0) {
        trustScore = Math.max(0, trustScore - deduction);
        // Overwrite the Trustpilot signal detail to show the deduction
        const existing = signals.find(s => s.name === "Trustpilot");
        if (existing) existing.detail += ` — score penalty applied (-${deduction} pts)`;
      }
    }
  }

  return { trustScore, signals };
}

export function calculateReturnRisk(data: ScrapedData): { risk: RiskLevel; reason: string } {
  if (!data.hasReturnPolicy || !data.returnPolicyText) {
    return { risk: "HIGH", reason: "No return policy found on this store." };
  }

  const text = data.returnPolicyText.toLowerCase();
  let riskPoints = 0;

  const highRiskPhrases = [
    "all sales final",
    "no refund",
    "no return",
    "no exchange",
    "non-refundable",
    "store credit only",
  ];

  const mediumRiskPhrases = [
    "customer pays",
    "buyer pays",
    "return shipping",
    "restocking fee",
    "15%",
    "20%",
    "within 7 days",
    "within 14 days",
    "unopened only",
    "original packaging",
  ];

  const lowRiskPhrases = [
    "free return",
    "prepaid label",
    "30 day",
    "60 day",
    "full refund",
    "no questions asked",
    "hassle-free",
  ];

  for (const phrase of highRiskPhrases) {
    if (text.includes(phrase)) riskPoints += 3;
  }
  for (const phrase of mediumRiskPhrases) {
    if (text.includes(phrase)) riskPoints += 1;
  }
  for (const phrase of lowRiskPhrases) {
    if (text.includes(phrase)) riskPoints -= 2;
  }

  if (riskPoints >= 3) return { risk: "HIGH", reason: "Return policy contains high-risk terms." };
  if (riskPoints >= 1) return { risk: "MEDIUM", reason: "Return policy has some concerning terms." };
  return { risk: "LOW", reason: "Return policy appears reasonable." };
}
