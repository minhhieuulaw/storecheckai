# Phase 01 — UX Improvements

**Parent plan:** [plan.md](plan.md)
**Date:** 2026-03-26
**Priority:** High
**Implementation status:** 🔲 Pending
**Review status:** Awaiting approval

---

## Context
Quick-win changes to existing landing page components with no DB/API changes required.
Estimated effort: ~2–4h.

---

## Overview
Four targeted improvements to increase conversion and search visibility:
1. `SampleReport.tsx` — stronger CTA after the sample report
2. `ThreatHook.tsx` — sharper copy to increase sign-up urgency
3. `Pricing.tsx` — social proof (testimonials) per plan card
4. `app/page.tsx` + `app/layout.tsx` — JSON-LD structured data for SEO

---

## Key Insights
- `SampleReport` currently ends with a collapsible "Technical Analysis" section — no CTA block at the bottom. Users who scroll through the full sample have high intent but no prompt to act.
- `ThreatHook` bottom CTA strip links to `/register` with generic copy. A/B variants should target emotional triggers vs rational benefits.
- `Pricing` has no social proof. The "Most Popular" badge is layout-only — no user evidence. Adding 1 short quote per plan increases trust at the decision moment.
- `layout.tsx` has no JSON-LD. Adding `SoftwareApplication` + `Organization` + `FAQPage` schemas can yield rich results in Google (star ratings, FAQ dropdowns, sitelinks).

---

## Requirements
- [ ] No new dependencies
- [ ] All changes backward-compatible (no DB, no API)
- [ ] Respect existing i18n system (add translation keys or keep English-only for testimonials initially)
- [ ] Keep bundle size minimal — JSON-LD via `<script type="application/ld+json">` in layout

---

## Architecture

### 1. SampleReport CTA Block
Add a sticky/pinned CTA section **after** the technical analysis expand button (bottom of the report card):
```
┌──────────────────────────────────────────┐
│  ✓ You just saw what a full report looks like │
│  Check your store now — takes 30 seconds │
│  [  Start checking — it's free  ]        │
└──────────────────────────────────────────┘
```
- Gradient card matching existing style (`rgba(99,102,241,...)`)
- Button → `/register` (or `/dashboard` if logged in — detect via `useEffect` + `/api/auth/me`)
- Optional: show lock icon + "Unlock full report with Personal plan" sub-copy

### 2. ThreatHook A/B Variants
Replace static copy with a `variants` array and pick by `useMemo(() => variants[Math.floor(Math.random() * variants.length)], [])`.

**Variant A (current):** "Check before you checkout — protect your family's money."
**Variant B:** "You're 3 clicks away from knowing if this store will scam you."
**Variant C:** "That store you're about to buy from? We'll tell you if it's safe in 30 seconds."

Store variant in `localStorage('th_variant')` so it's stable per session. Log variant to `/api/analytics` (or just console for now).

### 3. Pricing Testimonials
Add a `testimonial` field to each plan config in `getPlans()`:
```ts
testimonial: {
  quote: "Saved me from a $140 fake sneaker site. Worth every penny.",
  author: "Emily R., verified buyer",
}
```
Render as a small quote block below the feature list, above the CTA button.

### 4. JSON-LD
In `app/layout.tsx`, add:
```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
```

Schema types:
- `SoftwareApplication` — name, description, applicationCategory, offers (3 plans), aggregateRating (seed with reasonable value initially)
- `Organization` — name, url, logo, contactPoint
- `FAQPage` — pull same Q&A data as FAQ component (hardcode for now, DRY later)
- `WebSite` — url, potentialAction (SearchAction pointing to homepage with query)

---

## Related Code Files
- [components/SampleReport.tsx](../../components/SampleReport.tsx) — add CTA at bottom
- [components/ThreatHook.tsx](../../components/ThreatHook.tsx) — A/B copy variants
- [components/Pricing.tsx](../../components/Pricing.tsx) — add testimonials
- [app/layout.tsx](../../app/layout.tsx) — add JSON-LD script tag
- [app/page.tsx](../../app/page.tsx) — no changes needed

---

## Implementation Steps

### Step 1 — SampleReport CTA
1. Open `components/SampleReport.tsx`
2. After the `</AnimatePresence>` closing the tech analysis block (line ~493), add a new `<motion.div>` CTA block
3. CTA should have: heading, subtext, button → `/register`
4. Optionally detect auth state: `useEffect(() => fetch('/api/auth/me')...)` to change CTA to "Check a store now" → `/dashboard`

### Step 2 — ThreatHook variants
1. Define `VARIANTS` array (3 objects: headline + subtext + ctaText)
2. Use `useMemo` seeded from `Math.random()`, persisted to `localStorage`
3. Replace hardcoded strings in the bottom CTA strip

### Step 3 — Pricing testimonials
1. Add `testimonial: { quote: string; author: string }` to each plan in `getPlans()`
2. In `PlanContent`, render quote block between `<ul>` features and `<button>`
3. Style: small italic quote in gray-400, author in gray-600, subtle left border accent

### Step 4 — JSON-LD
1. Create `/lib/structured-data.ts` with typed JSON-LD builder functions
2. In `app/layout.tsx` (Server Component), call builders and inject `<script>` tag
3. FAQ data: define shared `FAQ_ITEMS` array, import in both `FAQ.tsx` and structured data

---

## Todo List
- [ ] SampleReport: add CTA block with auth-aware button
- [ ] ThreatHook: implement A/B variant system (3 variants, localStorage persistence)
- [ ] Pricing: add testimonial per plan card
- [ ] Create `lib/structured-data.ts` with JSON-LD builders
- [ ] Inject JSON-LD into `app/layout.tsx`
- [ ] Test JSON-LD with Google Rich Results Test

---

## Success Criteria
- SampleReport has a visible CTA after the report preview
- ThreatHook renders one of 3 variants, stable per session
- Each pricing card has a testimonial quote
- Google Rich Results Test validates SoftwareApplication + FAQPage schemas
- No TypeScript errors, no new dependencies added

---

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `dangerouslySetInnerHTML` XSS | Low | Low | JSON.stringify escapes properly; data is static |
| A/B variant causes hydration mismatch | Medium | Medium | Init variant only in `useEffect`, not during SSR render |
| Testimonials feel fake | Low | Medium | Use realistic copy, no star ratings, no last names |

---

## Security Considerations
- JSON-LD is server-rendered static data — no user input involved, no XSS risk
- A/B variant uses `Math.random()` — no PII stored in localStorage

---

## Next Steps
After Phase 01 is complete → proceed to Phase 03 (Public API) or Phase 02 (Badge) as parallel workstreams.
