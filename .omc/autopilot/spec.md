# StorecheckAI — Full Rework Spec
Generated: 2026-03-27

## 1. Audit Findings

### 1.1 Scoring System Bugs
- **MAX_POINTS discrepancy**: Declared `123` but actual max earnable = 128 (5pt inflation → scores ~4% higher than they should be at mid-range)
- **Social Presence over-weighted**: 10pts (same as HTTPS, same as Return Policy) — social links are trivial to fake
- **Dark Patterns, Domain Redirect = 0 effect on score**: Currently only flag signals with 0pts, no negative contribution to final score
- **Email Domain Match** checked but not scored — signals computed but ignored in points
- **Post-normalization penalty inconsistency**: Trustpilot penalty is raw integer deduction (not % of score), creating non-linear behavior

### 1.2 Pipeline Issues
- **In-memory analysis cache** (`Map<string, CachedAnalysis>`) is process-local — not shared across containers in multi-instance deploy. Cache hit rate is 0% in load-balanced prod
- **Cache key = domain only**: `amazon.com/product1` and `amazon.com/product2` get same AI analysis (intentional but needs clear comment)
- **Free plan `checksPerMonth: 0`**: Free users are given initial credits at signup (not visible in quota.ts — must be in auth route). The PLAN_FEATURES object is misleading.
- **Starter plan `checksPerMonth: 0, savedHistory: false`**: Starter is a one-time credit pack, not subscription. This is non-obvious.
- **No overage system**: `overagePerCheck: null` for all plans. Top-up not implemented.
- **Check refund on error**: `addChecks(refundUserId, 1)` on analyze failure — good, but only fires if `checkConsumed = true` before the error. If scraper throws synchronously before that, no refund.

### 1.3 UI/UX Issues
- **Report page**: Entirely client-rendered (~19k tokens). No SSR → bad for SEO, slow first paint
- **Dashboard**: `getUserReports()` returns all reports for user — no pagination. With 1000 reports this is a DB problem
- **QuickAnalyze**: Input and button stack on mobile (flex-col on sm:), good. But locked state is confusing — shows "upgrade" button inside the analyze field
- **Verdict consistency**: Score thresholds in different places — fallback in `analyze.ts` uses `>=65` for BUY, `>=40` for CAUTION. `scoring.ts` has no thresholds. AI decides verdict. These are inconsistent.
- **Report page UX**: No breadcrumb back to dashboard. Share button doesn't actually share (just copies URL). Very long component with no section lazy loading.
- **Dashboard empty state**: No empty state when user has 0 reports — just shows empty arrays with 0s

### 1.4 Mobile Responsive Status
- DashboardShell: FIXED (CSS Module approach)
- Dashboard page: FIXED (px-4 py-6 sm:px-8)
- All 6 dashboard sub-pages: FIXED
- Auth pages: FIXED
- Landing components (Hero, SampleReport, ThreatHook, UpgradeModal): FIXED
- Report page: NEEDS MOBILE AUDIT

---

## 2. Proposed Scoring Model Redesign

### 2.1 Weight Rebalance

| Signal | Old | New | Reason |
|--------|-----|-----|--------|
| HTTPS | 10 | 10 | Critical — keep |
| Security Headers | 5 | 4 | Minor weight reduction |
| Return Policy | 10 | 10 | Critical — keep |
| Privacy Policy | 8 | 7 | Slight reduction |
| Terms of Service | 5 | 4 | Reduce |
| Contact Page | 5 | 4 | Reduce |
| Shipping Policy | 5 | 5 | Keep |
| Business Email | 8 | 8 | Keep |
| Phone Number | 7 | 6 | Reduce |
| Physical Address | 7 | 7 | Keep |
| About Page | 5 | 5 | Keep |
| Payment Methods | 5 | 5 | Keep |
| Domain Age | 15 | 14 | Slight reduction |
| Trustpilot | 8 | 10 | **Increase** — real-world signal |
| Business Registration | 5 | 5 | Keep |
| On-site Reviews | 3 | 3 | Keep |
| Cookie Consent | 2 | 2 | Keep |
| Social Presence | 10 | 7 | **Reduce** — easily faked |
| **Total** | **128** (123 declared) | **116** | Clean, intentional |

### 2.2 Penalty System (post-normalization)
New penalties applied AFTER normalization:
- Dark patterns detected: `-5` per tactic (max -10)
- Domain redirect: `-5`
- Keep existing Trustpilot severity penalties: -6/-16/-24/-32

### 2.3 Verdict Thresholds (standardize across codebase)
| Score | Verdict |
|-------|---------|
| 70+ | BUY |
| 40-69 | CAUTION |
| 0-39 | SKIP |

Update `analyze.ts` fallback to use these same thresholds.

---

## 3. Premium UI Direction

### 3.1 Dashboard
- Stats cards: add subtle gradient borders, better iconography
- Empty state when 0 reports: helpful prompt with sample store to check
- Checks counter: clearer visual (progress bar style or circular)
- Recent reports table: verdict badge pill, hover state

### 3.2 Report Page
- Verdict hero: larger trust score circle with animated fill, color-coded glow
- Signal grid: 2-column cards with status icon, cleaner spacing
- Price comparison: product cards with image, comparison bars
- Mobile: sticky verdict bar at bottom on mobile

### 3.3 Landing
- Hero: add animated trust score demo, real store example
- SampleReport: ensure grid is 1-col mobile, 3-col desktop (already fixed)
- Pricing: clearer plan differentiators

---

## 4. Pipeline Improvements

### 4.1 URL Validation
- Reject marketplace domains (amazon.com, ebay.com, etsy.com) with helpful message
- Detect and warn about shortened URLs (bit.ly, t.co, etc.)

### 4.2 Error UX
- Better scraper error messages surfaced to UI
- `isPartialData: true` cases should show a warning banner in report

### 4.3 Quota Display
- Add "0 checks" vs "never purchased" distinction in UI
- Show plan upgrade CTA contextually based on plan tier
