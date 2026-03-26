# StorecheckAI — UX, Badge & API Plan
**Date:** 2026-03-26
**Stack:** Next.js 16 · Drizzle ORM · Neon PostgreSQL · Stripe · Tailwind 4 · Hetzner VPS

## Overview
Three parallel revenue & growth workstreams:
- **Phase 01** — UX Improvements (conversion lift, SEO)
- **Phase 02** — Verified Store Badge (B2B merchant product)
- **Phase 03** — Public API v1 (developer/fintech monetization)

## Phases

| # | Phase | Priority | Status | File |
|---|-------|----------|--------|------|
| 01 | UX Improvements | High | 🔲 Pending | [phase-01-ux-improvements.md](phase-01-ux-improvements.md) |
| 02 | Verified Store Badge | High | 🔲 Pending | [phase-02-verified-badge.md](phase-02-verified-badge.md) |
| 03 | Public API v1 | Medium | 🔲 Pending | [phase-03-public-api.md](phase-03-public-api.md) |

## Dependencies
- Phase 01: No deps — standalone UI changes
- Phase 02: Requires new DB tables + Stripe products configured
- Phase 03: Requires new DB tables; independent of Phase 02

## Suggested Order
Phase 01 → Phase 03 → Phase 02
(Phase 01 is quick wins; Phase 03 is simpler than Phase 02; Phase 02 needs merchant onboarding UX)
