# Phase 02 — Verified Store Badge (B2B)

**Parent plan:** [plan.md](plan.md)
**Date:** 2026-03-26
**Priority:** High
**Implementation status:** 🔲 Pending
**Review status:** Awaiting approval

---

## Context
B2B recurring revenue stream. Store owners pay $29–$99/month to display a "StorecheckAI Verified" badge on their site. Modeled after McAfee SECURE / Norton Shopping Guarantee.

Estimated effort: ~2–3 days.

---

## Overview
1. DB schema: `merchants` + `merchant_subscriptions` tables
2. Stripe: new products for 3 badge tiers
3. Merchant landing page at `/merchant`
4. Merchant dashboard at `/merchant/dashboard`
5. Badge API endpoint `GET /api/badge/[domain]` → serves verification status
6. Embeddable JS widget (`/badge-widget.js`) — merchants embed `<script>` on their site
7. Admin UI: manage verified merchants

---

## Key Insights
- **Merchant = existing user + merchant role.** No separate auth system. Add `merchantDomain` + `merchantStatus` + `merchantTier` columns to existing `users` table. Reuse cookie session, `/api/auth/*` endpoints, and `verifySession()` as-is.
- Badge verification should be a **public, unauthenticated, cacheable endpoint** — merchants embed it on their storefront, so it must be fast (<100ms) and CORS-enabled.
- Widget must be <5KB. Use a bootstrap loader pattern: tiny inline script fetches verification status + renders SVG badge. No React.
- **Admin manually approves** after payment. Flow: user pays → `merchantStatus = 'pending'` → admin approves → `merchantStatus = 'active'`. Cancellation/refund → `'suspended'` automatically via webhook.

---

## Requirements
- [ ] New DB tables: `merchants`, `merchant_subscriptions`
- [ ] New Stripe products created (3 tiers)
- [ ] `/merchant` landing page (marketing, not authenticated)
- [ ] `/merchant/register` — merchant signup (separate from user signup)
- [ ] `/merchant/dashboard` — manage badge, view status, upgrade/cancel
- [ ] `GET /api/badge/[domain]` — public badge verification API (CORS enabled, cacheable)
- [ ] `GET /badge-widget.js` — embeddable script served from `/public/`
- [ ] Admin page `/admin/merchants` — list, approve, suspend merchants
- [ ] Stripe webhook handles `merchant_badge` subscription events

---

## Architecture

### DB Schema (additions to existing `users` table in `lib/schema.ts`)
No new table. Add columns to `users`:
```ts
// New columns on users table:
merchantDomain:             text("merchant_domain").unique(),        // null = not a merchant
merchantStatus:             text("merchant_status"),                 // null | 'pending' | 'active' | 'suspended'
merchantTier:               text("merchant_tier"),                   // null | 'basic' | 'pro' | 'business'
merchantStripeSubscriptionId: text("merchant_stripe_subscription_id"),
merchantBillingPeriodEnd:   text("merchant_billing_period_end"),
merchantApprovedAt:         text("merchant_approved_at"),
merchantApprovedBy:         text("merchant_approved_by"),            // admin user id
```

A user becomes a merchant by filling out `/merchant/register` form (sets `merchantDomain`, `merchantStatus = null` until payment). After payment: `merchantStatus = 'pending'`. After admin approval: `merchantStatus = 'active'`.

### Stripe Tiers
```
Badge Basic    $29/month  — badge display + monthly report summary
Badge Pro      $59/month  — badge + real-time score updates + "Verified" email seal
Badge Business $99/month  — all Pro + API access + priority support
```
Add to `lib/stripe.ts` as `BADGE_PLANS` object (separate from `STRIPE_PLANS`).

### Badge API
```
GET /api/badge/[domain]
Response: { verified: boolean, tier: string, score: number | null, since: string | null }
Headers: Cache-Control: public, s-maxage=300, stale-while-revalidate=600
         Access-Control-Allow-Origin: *
```
DB query: `SELECT status, tier, approved_at FROM merchants WHERE domain = $1`
Return `verified: true` only when `status = 'active'`.

### Widget Architecture (`/public/badge-widget.js`)
```js
// ~800 bytes unminified
(function() {
  var domain = window.location.hostname.replace('www.','');
  fetch('https://storecheckai.com/api/badge/' + domain)
    .then(r => r.json())
    .then(data => {
      if (!data.verified) return;
      var el = document.getElementById('storecheckai-badge');
      if (!el) return;
      el.innerHTML = '<a href="https://storecheckai.com/verify/' + domain + '" target="_blank">' +
        '<svg>...</svg></a>';  // inline SVG badge
    });
})();
```
Merchants embed:
```html
<div id="storecheckai-badge"></div>
<script src="https://storecheckai.com/badge-widget.js" async></script>
```

### Merchant Auth
- **Reuse existing session cookie + `verifySession()`** — no new auth system
- Merchant pages check `user.merchantDomain != null` to gate access to `/merchant/dashboard`
- Unauthenticated users on `/merchant/register` → standard `/register` + `/login` flow

### Page Structure
```
/merchant                  — landing page (marketing)
/merchant/register         — set merchantDomain (requires login, redirects to login first)
/merchant/dashboard        — badge status, embed code, billing (requires login + merchantDomain)
/merchant/dashboard/billing — Stripe portal
/admin/merchants           — admin list + approve/suspend
/api/merchant/register     — POST: set merchantDomain on current user
/api/merchant/badge-config — GET: return embed snippet for user's domain
/api/stripe/merchant-checkout — create Stripe checkout for badge plan
/api/badge/[domain]        — public verification API (no auth)
```
No `/merchant/login` — use existing `/login?from=/merchant/register`.

---

## Related Code Files
- [lib/schema.ts](../../lib/schema.ts) — add `merchants` table
- [lib/stripe.ts](../../lib/stripe.ts) — add `BADGE_PLANS`
- [app/api/stripe/webhook/route.ts](../../app/api/stripe/webhook/route.ts) — extend for merchant events
- [app/admin/page.tsx](../../app/admin/page.tsx) — reference for admin UI pattern
- [lib/auth.ts](../../lib/auth.ts) — reference for merchant-auth.ts
- [public/](../../public/) — place badge-widget.js here

---

## Implementation Steps

### Step 1 — DB + Stripe config
1. Add `merchants` table to `lib/schema.ts`
2. Run `npx drizzle-kit generate` → `npx drizzle-kit migrate` (or push)
3. Add `BADGE_PLANS` to `lib/stripe.ts`
4. Create Stripe products manually in dashboard (or via API in a script)

### Step 2 — Merchant registration
1. Add merchant columns to `users` table schema + migrate
2. Create `app/api/merchant/register/route.ts` — POST, requires session, sets `merchantDomain`
3. Create `app/merchant/register/page.tsx` — form: company name + domain (redirects to login if not authed)

### Step 3 — Badge API + widget
1. Create `app/api/badge/[domain]/route.ts` (public, CORS, cached)
2. Create `public/badge-widget.js` (vanilla JS, <1KB, fetches badge API)
3. Create `app/verify/[domain]/page.tsx` — public verification certificate page

### Step 4 — Merchant landing page
1. Create `app/merchant/page.tsx` — marketing page (pricing, value prop, embed demo)
2. Create `app/merchant/register/page.tsx` — signup form

### Step 5 — Merchant dashboard
1. Create `app/merchant/dashboard/page.tsx` — badge status, embed snippet, upgrade CTA
2. Create `app/merchant/dashboard/billing/page.tsx` — Stripe portal redirect

### Step 6 — Stripe integration
1. Create `app/api/stripe/merchant-checkout/route.ts`
2. Extend `app/api/stripe/webhook/route.ts` with `badge_` metadata cases

### Step 7 — Admin UI
1. Create `app/admin/merchants/page.tsx` — list all merchants, status badges
2. Add approve/suspend API: `app/api/admin/merchants/[id]/route.ts`

---

## Todo List
- [ ] Add merchant columns to `users` table + run migration
- [ ] Add `BADGE_PLANS` to stripe.ts + create Stripe products
- [ ] `POST /api/merchant/register` — set merchantDomain on current user
- [ ] `GET /api/badge/[domain]` — public badge check
- [ ] `public/badge-widget.js` — embeddable widget
- [ ] `/merchant` landing page
- [ ] `/merchant/register` signup page
- [ ] `/merchant/dashboard` — embed snippet + status
- [ ] `/merchant/dashboard/billing` — Stripe portal
- [ ] `/api/stripe/merchant-checkout` route
- [ ] Extend webhook for badge subscription events
- [ ] `/admin/merchants` admin page
- [ ] `/api/admin/merchants/[id]` approve/suspend endpoint
- [ ] `/verify/[domain]` public certificate page

---

## Success Criteria
- Merchant can register, subscribe to a badge plan via Stripe, and get an embed snippet
- Badge widget renders on merchant's site within 500ms
- Admin can approve/suspend from dashboard
- Badge API returns `verified: true` only for `status = 'active'` merchants
- Stripe webhook correctly sets `status = 'active'` on payment and `'suspended'` on cancellation

---

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Domain spoofing (merchant claims a domain they don't own) | Medium | High | Manual admin approval step before status goes active; optional: DNS TXT verification |
| Badge widget blocked by CSP | Low | Medium | Document CSP requirements; widget uses simple fetch + DOM |
| Merchant session conflicts with user session | Low | Medium | Different cookie name (`merchant_session` vs `session`); different JWT secret env var |
| Stripe product mismatch | Low | High | Use `BADGE_PLANS` metadata key to distinguish from user plans in webhook |

---

## Security Considerations
- Store merchant `passwordHash` with same PBKDF2 method as users
- Badge API is public/unauthenticated — only exposes `{ verified, tier, since }`, never PII
- Admin approve/suspend endpoint must verify admin session (reuse existing `lib/admin.ts` pattern)
- Separate Stripe webhook secret or filter by `metadata.type = 'badge'` to avoid cross-contamination

---

## Next Steps
- Phase 02 can proceed in parallel with Phase 03
- After launch: consider DNS TXT verification to prevent domain spoofing
- Long term: badge widget could show real-time trust score (requires Phase 03 API)

---

## Decisions Made
- ✅ Merchant = existing user + extra columns (no separate auth)
- ✅ Admin manually approves after payment (`merchantStatus: pending → active`)
- Multi-domain per merchant: later (V2)
