# Phase 03 — Public API v1

**Parent plan:** [plan.md](plan.md)
**Date:** 2026-03-26
**Priority:** Medium
**Implementation status:** 🔲 Pending
**Review status:** Awaiting approval

---

## Context
Expose StorecheckAI's core analysis as a paid API. Target: indie devs ($49/mo), fintech/payment processors ($299/mo), banks/enterprise (custom). Revenue potential: $5k-$50k MRR at scale.

Estimated effort: ~2–3 days.

---

## Overview
1. DB schema: `api_keys` + `api_usage` tables
2. API key generation and management in user dashboard
3. `POST /api/v1/check` — authenticated via `Authorization: Bearer sk_xxx`
4. Rate limiting per tier using PostgreSQL (single-VPS, no Redis needed)
5. `/api/v1/docs` — API documentation page (Scalar UI)
6. New Stripe plans for API tiers
7. Admin UI: view API usage per key

---

## Key Insights
- Store **hashed** API keys only. Key format: `sk_live_<22-char-nanoid>`. Store `prefix` (first 7 chars) for fast lookup + `keyHash` (SHA-256) for verification.
- Rate limiting on single VPS: PostgreSQL sliding window is acceptable (<15ms overhead at low-medium load). For >500 req/sec, switch to Redis — but that's not needed now.
- `@scalar/nextjs-api-reference` is the best choice for API docs in Next.js: embeds in a route handler, no extra server, looks professional, supports OpenAPI 3.1.
- API v1 should reuse the existing `analyzeWithAI` + `scrapeStore` pipeline from `/api/analyze`. Key difference: API auth via Bearer token instead of cookie session; no plan quota (rate limit instead); response is always full report data.
- Separate `api_plans` from `users.plan` — API subscribers get `api_keys` linked to their `users.id`, but the API plan is a separate Stripe product.

---

## Requirements
- [ ] New DB tables: `api_keys`, `api_usage`
- [ ] API key generation endpoint: `POST /api/user/api-keys`
- [ ] API key management in dashboard: `app/dashboard/api/page.tsx`
- [ ] `POST /api/v1/check` — bearer auth, rate limited, full analysis
- [ ] `GET /api/v1/usage` — bearer auth, return usage stats for current key
- [ ] `GET /api/v1/docs` — embedded Scalar documentation
- [ ] New Stripe API plans added to `STRIPE_PLANS`
- [ ] Webhook handles API subscription events (grant API access)
- [ ] Rate limiting via PostgreSQL (no new infra)

---

## Architecture

### DB Schema
```ts
export const apiKeys = pgTable("api_keys", {
  id:          text("id").primaryKey(),                   // nanoid
  userId:      text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  prefix:      text("prefix").notNull().unique(),         // first 7 chars, index for fast lookup
  keyHash:     text("key_hash").notNull(),                // SHA-256 of full key
  name:        text("name").notNull(),                    // user-defined label
  tier:        text("tier").notNull(),                    // 'starter_api' | 'business_api' | 'enterprise_api'
  rateLimit:   integer("rate_limit").notNull(),           // requests per day
  isActive:    boolean("is_active").default(true).notNull(),
  lastUsedAt:  text("last_used_at"),
  createdAt:   text("created_at").notNull(),
});

export const apiUsage = pgTable("api_usage", {
  id:        text("id").primaryKey(),
  apiKeyId:  text("api_key_id").notNull().references(() => apiKeys.id, { onDelete: "cascade" }),
  endpoint:  text("endpoint").notNull(),                  // '/api/v1/check'
  statusCode: integer("status_code").notNull(),
  durationMs: integer("duration_ms"),
  createdAt:  text("created_at").notNull(),               // ISO string, index for sliding window
});
// Index: CREATE INDEX ON api_usage(api_key_id, created_at);
```

### Stripe API Plans (additions to `lib/stripe.ts`)
```ts
export const API_PLANS = {
  api_starter: {
    name: "API Starter",
    price: 4900,             // $49/month
    mode: "subscription",
    rateLimit: 1000,         // req/day
    tier: "starter_api",
    trialDays: 1,            // 1-day free trial
  },
  api_business: {
    name: "API Business",
    price: 29900,            // $299/month
    mode: "subscription",
    rateLimit: 10000,        // req/day
    tier: "business_api",
    trialDays: 1,            // 1-day free trial
  },
} as const;
```

### Auth Middleware for v1 routes
```ts
// lib/api-auth.ts
export async function verifyApiKey(authHeader: string | null): Promise<{
  valid: boolean;
  apiKey?: ApiKeyRow;
  error?: string;
}> {
  if (!authHeader?.startsWith("Bearer sk_")) return { valid: false, error: "Missing API key" };
  const rawKey = authHeader.slice(7);
  const prefix = rawKey.slice(0, 7);
  const hash   = sha256(rawKey);
  const key    = await db.select().from(apiKeys)
    .where(and(eq(apiKeys.prefix, prefix), eq(apiKeys.keyHash, hash), eq(apiKeys.isActive, true)))
    .limit(1);
  if (!key[0]) return { valid: false, error: "Invalid or revoked API key" };
  return { valid: true, apiKey: key[0] };
}
```

### Rate Limiting (PostgreSQL sliding window)
```ts
// lib/api-rate-limit.ts
export async function checkRateLimit(apiKeyId: string, limitPerDay: number): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: string;
}> {
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const result = await db.execute(sql`
    SELECT COUNT(*) as count FROM api_usage
    WHERE api_key_id = ${apiKeyId} AND created_at > ${windowStart} AND status_code < 500
  `);
  const used = Number(result.rows[0].count);
  const remaining = Math.max(0, limitPerDay - used);
  const resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  return { allowed: used < limitPerDay, remaining, resetAt };
}
```

### `POST /api/v1/check` Pipeline
```
1. Extract Bearer token from Authorization header
2. verifyApiKey() → get apiKey row (includes tier + rateLimit)
3. checkRateLimit() → if exceeded, return 429 with X-RateLimit-* headers
4. Parse body { url, options? }
5. Reuse scrapeStore() + calculateTrustScore() + analyzeWithAI()
6. Log to api_usage (async, non-blocking)
7. Update apiKeys.lastUsedAt (async)
8. Return full Report JSON
```

Response headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 2026-03-27T12:00:00Z
```

### API Docs (`/api/v1/docs`)
- Install `@scalar/nextjs-api-reference` (dev dep)
- Create `app/api/v1/docs/route.ts` using `ApiReference` from Scalar
- Create `public/openapi.yaml` with full OpenAPI 3.1 spec
- Spec covers: `/api/v1/check`, `/api/v1/usage`, auth scheme (Bearer), response models, error codes

### Dashboard API Key Management (`/dashboard/api`)
- List existing keys (prefix, name, tier, lastUsed, rateLimit)
- Generate new key button → calls `POST /api/user/api-keys` → shows key once (never again)
- Revoke key button
- Usage graph (last 7 days, from `api_usage` table)

---

## Related Code Files
- [lib/schema.ts](../../lib/schema.ts) — add `api_keys`, `api_usage` tables
- [lib/stripe.ts](../../lib/stripe.ts) — add `API_PLANS`
- [lib/analyze.ts](../../lib/analyze.ts) — reuse `analyzeWithAI`
- [lib/scraper.ts](../../lib/scraper.ts) — reuse `scrapeStore`
- [app/api/analyze/route.ts](../../app/api/analyze/route.ts) — reference for analysis pipeline
- [app/api/stripe/webhook/route.ts](../../app/api/stripe/webhook/route.ts) — extend for API subscription
- [app/dashboard/](../../app/dashboard/) — reference for dashboard page patterns

---

## Implementation Steps

### Step 1 — DB + Stripe config
1. Add `apiKeys`, `apiUsage` to `lib/schema.ts`
2. Add `CREATE INDEX ON api_usage(api_key_id, created_at)` in migration
3. Run `npx drizzle-kit generate && npx drizzle-kit migrate`
4. Add `API_PLANS` to `lib/stripe.ts`

### Step 2 — API key infrastructure
1. Create `lib/api-auth.ts` (verifyApiKey with SHA-256 prefix lookup)
2. Create `lib/api-rate-limit.ts` (PostgreSQL sliding window)

### Step 3 — API key management endpoints
1. `POST /api/user/api-keys` — generate key, return plaintext once
2. `DELETE /api/user/api-keys/[id]` — revoke key
3. `GET /api/user/api-keys` — list keys (no hash, prefix only)

### Step 4 — v1 endpoints
1. `POST /api/v1/check` — full analysis with bearer auth + rate limiting
2. `GET /api/v1/usage` — return usage stats for authenticated key

### Step 5 — API documentation
1. Install `@scalar/nextjs-api-reference`
2. Create `public/openapi.yaml`
3. Create `app/api/v1/docs/route.ts`

### Step 6 — Stripe integration
1. Create `app/api/stripe/api-checkout/route.ts`
2. Extend webhook to handle `api_` tier metadata → grant API access

### Step 7 — Dashboard UI
1. Create `app/dashboard/api/page.tsx` — key list, generate, revoke, usage chart
2. Add "API" nav item in `app/dashboard/layout.tsx`

---

## Todo List
- [ ] Add `apiKeys` + `apiUsage` to schema + run migration
- [ ] Add `API_PLANS` to stripe.ts
- [ ] Create `lib/api-auth.ts` (verifyApiKey)
- [ ] Create `lib/api-rate-limit.ts` (sliding window)
- [ ] `POST /api/user/api-keys` — generate key
- [ ] `DELETE /api/user/api-keys/[id]` — revoke key
- [ ] `GET /api/user/api-keys` — list keys
- [ ] `POST /api/v1/check` — main API endpoint
- [ ] `GET /api/v1/usage` — usage stats endpoint
- [ ] Create `public/openapi.yaml`
- [ ] Install `@scalar/nextjs-api-reference` + create docs route
- [ ] API Stripe checkout route
- [ ] Extend webhook for API subscription events
- [ ] `app/dashboard/api/page.tsx` — key management UI
- [ ] Add API nav item to dashboard layout

---

## Success Criteria
- `POST /api/v1/check` with valid Bearer key returns full report JSON
- Rate limit headers present on every response
- 429 returned when daily limit exceeded
- API docs page renders at `/api/v1/docs` with correct schema
- Keys shown only once at generation; stored as SHA-256 hash only
- Admin can see per-key usage in admin dashboard

---

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| API key brute force | Low | High | Prefix lookup makes brute force impractical; add IP-based rate limit on auth failures |
| PostgreSQL rate limit too slow under load | Low | Medium | Acceptable for <100 req/sec on VPS; document Redis upgrade path |
| API key displayed after generation lost by user | Medium | Low | "Copy now — shown once" UI with clipboard button; user can revoke + regenerate |
| Analysis pipeline too slow (60s timeout) | Medium | Medium | Inherit `maxDuration = 60` from analyze route; document in API docs |

---

## Security Considerations
- **Never store plaintext keys** — SHA-256 hash only. On generation, return key once to user.
- Prefix (7 chars) stored unencrypted for fast DB lookup — not a security risk (need hash to verify)
- API key endpoint must be behind user session auth (not public)
- `X-Forwarded-For` IP rate limiting on top of key-based limiting to prevent abuse of trial keys
- OpenAPI spec should document 401/429/402 error codes clearly

---

## Next Steps
- After basic API is live: add webhook support (notify merchant URL on check completion)
- Enterprise tier: custom rate limits via DB config, dedicated support SLA
- Consider `@upstash/ratelimit` if VPS scales to multi-instance

---

## Decisions Made
- ✅ **1-day free trial** via Stripe `trial_period_days: 1`
- API returns same `Report` type as web app (simplest, most useful for devs)
- No free-tier API access (must subscribe to get API key)
