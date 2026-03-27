# StorecheckAI — Autopilot Implementation Plan
Generated: 2026-03-27
Spec: ../.omc/autopilot/spec.md

## Phase 1: Scoring System Fix [HIGH PRIORITY]
**Goal**: Fix bugs, rebalance weights, add penalties for dark patterns

Files: `lib/scoring.ts`, `lib/analyze.ts`

### Changes:
1. Fix `MAX_POINTS` from 123 → 116 (match new weight table)
2. Rebalance weights per spec table
3. Add post-normalization penalties: dark patterns (-5 each, max -10), redirect (-5)
4. Standardize verdict thresholds: BUY≥70, CAUTION≥40, SKIP<40
5. Fix fallback in `analyze.ts` to use same thresholds (was 65/40)

## Phase 2: Dashboard UI Premium [HIGH PRIORITY]
**Goal**: Stats cards with gradient accents, empty state, better plan badge

Files: `app/dashboard/page.tsx`, `components/dashboard/QuickAnalyze.tsx`

### Changes:
1. Stats cards: add left-border color accent, hover glow
2. Empty state when 0 reports: show "Analyze your first store" prompt
3. Checks counter: show as `N remaining` with color-coded dot (green/yellow/red)
4. Recent reports: verdict badge pill style, show score circle
5. QuickAnalyze: remove locked state confusion, show upgrade modal on focus when locked

## Phase 3: Pipeline Reliability [MEDIUM PRIORITY]
**Goal**: Better URL validation, clearer error messages, quota UX

Files: `app/api/analyze/route.ts`, `components/dashboard/QuickAnalyze.tsx`

### Changes:
1. Reject known marketplace domains with specific message
2. Detect shortened URLs (bit.ly, t.co, goo.gl) and return friendly error
3. Surface `isPartialData` warning in report page
4. QuickAnalyze: show `isPartialData` warning banner after analysis

## Phase 4: Report Page Redesign [HIGH PRIORITY]
**Goal**: Premium verdict hero, better signal cards, mobile sticky bar

Files: `app/report/[id]/page.tsx`

### Changes:
1. Verdict hero: larger score circle with animated SVG fill (CSS animation), glow ring
2. Signal grid: 2-col layout on desktop, cleaner pass/warn/fail colors
3. Add breadcrumb "← Back to Dashboard" link if user is logged in
4. Mobile: sticky verdict summary bar at bottom (score + verdict + CTA)
5. Price comparison: add comparison table with color-coded verdict badges
6. Fix Share button: implement Web Share API with fallback copy

## Phase 5: Landing Page Polish [MEDIUM PRIORITY]
**Goal**: More premium, higher conversion, consistent with dashboard

Files: `components/Hero.tsx`, `components/SampleReport.tsx`, `components/Pricing.tsx`

### Changes:
1. Hero: add animated trust score counter (counting up animation)
2. SampleReport: already mobile-fixed, add subtle hover effects on health buckets
3. Pricing: add "Most Popular" badge to Personal plan, clearer feature comparison

## Status Tracking
- [ ] Phase 1: Scoring Fix
- [ ] Phase 2: Dashboard UI
- [ ] Phase 3: Pipeline Reliability
- [ ] Phase 4: Report Page
- [ ] Phase 5: Landing Polish
