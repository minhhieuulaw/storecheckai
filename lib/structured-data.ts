// Static FAQ items for JSON-LD (English only, mirrors i18n.tsx en.faq.items)
const FAQ_ITEMS = [
  {
    q: "What types of stores can I analyze?",
    a: "StorecheckAI works with virtually any publicly accessible e-commerce URL — Shopify stores, Amazon listings, Etsy, Walmart, Temu, and general DTC brands. Just paste the product or store URL and we'll handle the rest.",
  },
  {
    q: "What does a full report include?",
    a: "A complete report includes: a trust score (0–100), a BUY / CAUTION / SKIP verdict with explanation, return risk rating, review confidence level, pros & cons, red flags, suspicious signals, price comparison against Amazon and AliExpress/Temu, and Trustpilot review snippets where available.",
  },
  {
    q: "What's the difference between Starter, Personal, and Pro?",
    a: "Starter is pay-per-use at $2.99/check — no subscription. Personal ($19.99/mo) includes 10 full checks per month, with $1.25 per extra check. Pro ($39.99/mo) includes 50 checks per month at $1.00 per extra check. Personal and Pro unlock full reports, saved report history, and all advanced features.",
  },
  {
    q: "Are my reports saved after the check?",
    a: "Starter checks are run anonymously — nothing is saved. Personal and Pro subscribers can access their full report history from the dashboard at any time.",
  },
  {
    q: "How accurate is the AI trust score?",
    a: "We analyze 20+ signals: domain age, HTTPS, contact details, return & privacy policy quality, social presence, Trustpilot ratings, review patterns, and manipulation tactics. No tool is perfect, but we surface the red flags that matter most before you spend money.",
  },
  {
    q: "Will my report be in my language?",
    a: "Yes. When you select a language, all AI-generated text in your report — verdict, return summary, pros, cons, red flags, and review analysis — is returned in that language.",
  },
];

export function buildJsonLd(appUrl: string): object[] {
  const softwareApp = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "StorecheckAI",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    url: appUrl,
    description:
      "AI-powered online store safety checker. Paste any store URL and get an instant trust score, verdict, return risk rating, and review analysis in under 30 seconds.",
    offers: [
      {
        "@type": "Offer",
        name: "Starter",
        price: "2.99",
        priceCurrency: "USD",
        description: "1 store check — pay per use, no subscription",
      },
      {
        "@type": "Offer",
        name: "Personal",
        price: "19.99",
        priceCurrency: "USD",
        description: "10 full checks per month",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "39.99",
        priceCurrency: "USD",
        description: "50 full checks per month",
      },
    ],
  };

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "StorecheckAI",
    url: appUrl,
    description: "AI-powered pre-purchase store safety checks for online shoppers.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${appUrl}/dashboard/support`,
    },
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map(item => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  const webSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "StorecheckAI",
    url: appUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${appUrl}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return [softwareApp, organization, faqPage, webSite];
}
