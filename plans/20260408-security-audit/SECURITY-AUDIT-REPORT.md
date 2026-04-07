# Security Audit Report — StorecheckAI
**Date**: 2026-04-08
**Scope**: Full codebase audit + 7-layer Vibecoding security assessment

---

## System Overview
- **Stack**: Next.js 16 (App Router) + React 19 + Drizzle ORM + Neon Postgres
- **Auth**: JWT (HS256) + PBKDF2 password hashing (100k iterations) + email verification
- **Billing**: Stripe (checkout, subscriptions, webhooks)
- **AI**: OpenAI (gpt-4o-mini) + Anthropic Claude
- **Deploy**: Docker multi-stage + Nginx reverse proxy on Hetzner VPS
- **Email**: Resend | **Storage**: AWS S3
- **Monitoring**: Sentry (error tracking + session replay)

---

## 7-Layer Security Assessment

### Layer 1: Infrastructure Isolation ✅ PASS
- Docker multi-stage build with non-root `nextjs` user (uid 1001)
- Nginx reverse proxy with TLS 1.2+
- Separate app/nginx containers via Docker Compose

### Layer 2: Secret Management ✅ FIXED
- `.env*` properly gitignored; `.env.production.example` has only placeholders
- No secrets in git history (verified)
- **FIXED**: `proxy.ts` had fallback secret `"fallback-secret-change-me"` → now throws error
- **FIXED**: `.mcp.json` had hardcoded grapuco API key → moved to env var via shell expansion

### Layer 3: API Protection (CORS/CSP) ✅ FIXED
- Nginx: X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy (existing)
- **ADDED**: Content-Security-Policy in both `next.config.ts` and `nginx/app.conf`
- **ADDED**: Permissions-Policy (camera, microphone, geolocation disabled)
- CORS: Next.js default same-origin (adequate for current architecture)

### Layer 4: Dependency Validation ✅ FIXED
- All dependencies are legitimate, well-known packages
- `package-lock.json` present for deterministic installs
- **FIXED**: `npm audit fix` applied — picomatch (HIGH), brace-expansion (MODERATE) patched
- **UPGRADED**: `@anthropic-ai/sdk` 0.80 → latest (fixed sandbox escape vulnerability)
- **ADDED**: `npm audit --audit-level=high` step in CI/CD pipeline (blocks deploy on HIGH+ severity)
- Remaining: 4 moderate (esbuild via drizzle-kit — dev-only, no production impact)

### Layer 5: Rate Limiting ✅ FIXED
- `/api/analyze`: 10 req/min per IP (existing)
- `/api/auth/login`, `/api/auth/register`: rate limited (existing)
- **ADDED**: `/api/facebook-check`: 5 req/min per IP (was completely unprotected, each call costs OpenAI credits)
- Note: in-memory rate limiters — adequate for single-instance deployment

### Layer 6: Monitoring ✅ FIXED
- Health check endpoint exists (`/api/health`)
- Docker healthcheck configured (30s interval)
- **ADDED**: Sentry SDK (`@sentry/nextjs`) with:
  - Client-side error tracking + session replay (1% normal, 100% on error)
  - Server-side error tracking (Node.js + Edge runtimes)
  - Global error boundary (`app/global-error.tsx`)
  - Instrumentation hook for automatic capture
  - Source map upload support
- **ACTION REQUIRED**: Set `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_AUTH_TOKEN` in production env

### Layer 7: Least Privilege ✅ FIXED
- **ADDED**: SQL script for restricted DB user (`scripts/create-restricted-db-user.sql`)
  - `storecheckai_app` user with CRUD-only permissions
  - Cannot DROP/ALTER/TRUNCATE tables
- **UPGRADED**: Admin system from email-only → role-based with email fallback
  - Added `role` column to `users` table (`'user' | 'admin'`)
  - `requireAdminSession()` now checks role first, falls back to email for legacy users
  - Migration script: `scripts/add-role-column.sql`
- Report API (`/api/report/[id]`) confirmed public by design (shareable links)

---

## All Changes Made

### Phase 1 (Security Fixes)

| File | Change | Severity Fixed |
|------|--------|---------------|
| `proxy.ts` | Replaced fallback secret with error throw | HIGH |
| `app/api/facebook-check/route.ts` | Added IP-based rate limiting (5/min) | HIGH |
| `next.config.ts` | Added CSP + Permissions-Policy + Sentry integration | MEDIUM |
| `nginx/conf.d/app.conf` | Added CSP + Permissions-Policy headers | MEDIUM |
| `.mcp.json` | Removed hardcoded API key, use shell env var | CRITICAL |

### Phase 2 (Recommendations Implemented)

| File | Change |
|------|--------|
| `package.json` | Upgraded `@anthropic-ai/sdk`, added `@sentry/nextjs` |
| `.github/workflows/deploy.yml` | Added `security-audit` job (npm audit gate) |
| `sentry.client.config.ts` | Client-side Sentry init |
| `sentry.server.config.ts` | Server-side Sentry init |
| `sentry.edge.config.ts` | Edge runtime Sentry init |
| `instrumentation.ts` | Next.js instrumentation hook for Sentry |
| `app/global-error.tsx` | Global error boundary with Sentry capture |
| `.env.production.example` | Added Sentry DSN + auth token placeholders |
| `lib/schema.ts` | Added `role` column to users table |
| `lib/auth.ts` | Added `role` field to User interface |
| `lib/admin.ts` | Role-based admin check with email fallback |
| `scripts/add-role-column.sql` | Migration: add role column + set admin |
| `scripts/create-restricted-db-user.sql` | SQL: create restricted app DB user |

---

## Deployment Checklist

Before deploying these changes:

1. **Run migration**: Execute `scripts/add-role-column.sql` on Neon database
2. **Set Sentry env vars**: Add `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_AUTH_TOKEN` to production
3. **Optional**: Run `scripts/create-restricted-db-user.sql` and update `DATABASE_URL`
4. **Optional**: Set `GRAPUCO_API_KEY` in system environment for local dev

---

## Remaining Recommendations (Future)

1. **Redis Rate Limiting**: For multi-instance deployments
2. **Postgres RLS**: Defense-in-depth on `reports`, `tickets`, `scam_reports` tables
3. **JWT Refresh Tokens**: Current 7-day sessions have no refresh mechanism
4. **Structured Logging**: Replace `console.error` with structured logger (pino/winston)
