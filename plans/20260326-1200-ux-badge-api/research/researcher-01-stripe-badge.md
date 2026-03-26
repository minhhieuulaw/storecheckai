# Research: Stripe Badge API & Widget Architecture

## 1. Stripe Subscription Structure for Verified Store Badge

### Product/Plan Architecture
- **Separate Product**: Create dedicated Stripe product for "Verified Store Badge" (e.g., `prod_badge_v1`), independent from existing user subscription products
- **Price Tiers**: Define 3 price objects under badge product:
  - Basic: $29/month (single store)
  - Pro: $59/month (5 stores)
  - Enterprise: $99/month (unlimited stores)
- **Metadata Fields** (50 key-value pairs max, keys 40 chars, values 500 chars):
  ```json
  {
    "product_type": "badge",
    "badge_tier": "pro",
    "max_stores": "5",
    "features": "priority_support,custom_color",
    "internal_user_id": "usr_123456",
    "store_ids": "store_abc,store_def"
  }
  ```

### Webhook Events to Monitor
1. `customer.subscription.created` — new badge subscription starts
2. `customer.subscription.updated` — plan upgrades/downgrades
3. `customer.subscription.deleted` — cancellation, revoke badge access
4. `invoice.payment_succeeded` — renewal successful
5. `invoice.payment_failed` — handle dunning via Smart Retries

### Implementation Pattern
- Store Stripe subscription_id + customer_id in app database, linked to merchant account
- Use subscription metadata to track current tier + store limits
- Update local cache on webhook events (300-600s stale tolerance acceptable)
- Proration on tier changes via Stripe's automatic prorating

### Key Practices
- Always verify webhook signatures (replay attacks)
- Process webhooks idempotently (Stripe retries duplicates)
- Use Stripe Checkout hosted pages (40+ language support, auto-payment method detection)
- Enable Smart Retries for 41% recovery on failed payments

---

## 2. Embeddable Trust Badge Widget (<5KB)

### Architecture: Bootstrap + Dynamic Load
```html
<!-- Merchant embeds single line: -->
<script src="https://yourdomain.com/badge.js?store_id=abc123"></script>

<!-- Loads lightweight bootstrap (1KB), which: -->
<!-- 1. Injects SVG inline -->
<!-- 2. Makes single /api/verify-badge API call -->
<!-- 3. Caches response in localStorage 1 hour -->
```

### SVG Badge Implementation
- **Static SVG Template** (~600 bytes, base64 encodable):
  ```svg
  <svg width="160" height="60" viewBox="0 0 160 60">
    <rect rx="4" fill="#10b981"/>
    <text x="80" y="38" text-anchor="middle" fill="white">
      ✓ Verified Store
    </text>
  </svg>
  ```
- Render server-side OR generate client-side; SVG fully cacheable
- No DOM pollution: use shadow DOM or namespace CSS selectors

### API Verification Flow
```javascript
// bootstrap.js (~800 bytes minified)
fetch('https://api.yourdomain.com/badge/verify?store_id=abc123', {
  headers: { 'X-Origin': window.location.origin }
})
.then(r => r.json())
.then(data => {
  if (data.verified) {
    const svg = document.createElement('div');
    svg.innerHTML = data.svg;
    document.currentScript.parentNode.insertBefore(svg, document.currentScript);
    // Cache in localStorage with expiry
    localStorage.setItem(`badge_${storeId}`, JSON.stringify({
      svg: data.svg,
      expires: Date.now() + 3600000
    }));
  }
});
```

### Caching Strategy: Cache-First with Revalidation
- **Client-side**: localStorage 1 hour (fast repeat views)
- **Server CDN**: badge SVG assets cached 24h
- **API response**: Cache-Control: max-age=300 (5min), with background refresh
- **Stale-While-Revalidate**: return cached badge, fetch fresh data async

### Cross-Origin Best Practices
- Enable CORS on badge API: `Access-Control-Allow-Origin: *`
- Embed via `<script src>` (no CORS needed) + JSON-P fallback
- Use secure token in query string for store_id validation (HMAC-signed)
- Attribute CSP `script-src` whitelist for hosted badge script

### Size Optimization
- Minified bootstrap: ~800 bytes
- SVG inline: ~600 bytes
- Total first load: ~1.4KB (uncompressed)
- With gzip: ~500 bytes
- Cache hit: ~100 bytes (localStorage check)

---

## 3. JSON-LD Structured Data for SaaS Landing Page

### Priority Schema Types (Implementation Order)
1. **SoftwareApplication** — Most impactful for SaaS: features, pricing, reviews
2. **Organization** — Brand identity, contact, service info
3. **FAQPage** — Boost CTR 30% on FAQ sections
4. **WebSite** — Site-wide metadata (optional, less critical)

### Recommended SoftwareApplication Schema
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Store Checker AI",
  "description": "Verify merchant store legitimacy",
  "url": "https://storecheckai.com",
  "applicationCategory": "WebApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "USD",
    "price": "29.00",
    "priceValidUntil": "2027-03-26",
    "description": "Verified Store Badge, Basic tier"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "150"
  },
  "author": {
    "@type": "Organization",
    "name": "Store Checker AI",
    "url": "https://storecheckai.com"
  }
}
```

### FAQPage Schema (Quick Wins for CTR)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How does verification work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We check 100+ merchant data sources..."
      }
    }
  ]
}
```

### SEO Impact Summary
- **SoftwareApplication + aggregateRating**: Rich snippet with ratings, +30% CTR uplift
- **FAQPage**: Featured snippets in position 0, more mobile clicks
- **Pricing in schema**: AI search engines (Gemini, ChatGPT) parse product tier pricing upfront
- **Google** crawls structured data for Knowledge Graph eligibility

### Implementation Tips
- Use JSON-LD (Google's preferred format)
- Validate via [Google Rich Results Test](https://search.google.com/test/rich-results)
- Include multiple schema types (compound markup) on landing page
- Update pricing schema when tiers change (automated via CMS)
- Prioritize SoftwareApplication + Organization; others are optional

---

## Key Takeaways

| Component | Size | Caching | Complexity |
|-----------|------|---------|-----------|
| Badge widget | <5KB | localStorage 1h | Low (fetch + render) |
| Stripe integration | API-based | webhook-driven | Medium (dunning, proration) |
| JSON-LD schema | 1-2KB | static/change-driven | Low (template vars only) |

**Unresolved Questions**
- Exact verification criteria for badge eligibility (regulatory checks, manual review?)
- Merchant dashboard UX for managing multiple stores under single badge subscription
- Fallback behavior if API is down (serve cached badge?)
