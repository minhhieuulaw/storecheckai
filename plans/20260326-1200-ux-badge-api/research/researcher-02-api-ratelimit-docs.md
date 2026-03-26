# API Authentication, Rate Limiting & Documentation Research
**Date:** 2026-03-26 | **Topic:** Next.js API Design Patterns

---

## 1. API Key Authentication in Next.js App Router

### Bearer Token Implementation
- Extract from `Authorization: Bearer sk_xxx` header in middleware/route handlers
- Never store plaintext keys; hash with **bcrypt** (cost factor 12 ≈ 250ms/hash, prevents brute-force)
- Return full key once on generation; never retrievable after creation
- Key format: `sk_` + 32 random bytes (cryptographically sound)

### PostgreSQL Hashing & Lookup Strategy
**Schema approach (Supabase reference):**
```sql
-- Private schema (clients cannot access)
CREATE SCHEMA api_keys_private;

CREATE TABLE api_keys_private.keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  key_hash TEXT NOT NULL,       -- bcrypt hash
  key_prefix VARCHAR(7) NOT NULL, -- first 7 chars for fast lookup
  tier_id INT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  rotated_at TIMESTAMP,
  revoked_at TIMESTAMP
);

-- Critical: index on prefix for <10ms lookups with ~500 keys
CREATE INDEX idx_api_keys_prefix ON api_keys_private.keys(key_prefix);
-- Without index: 200ms+ scans; with index: <10ms

CREATE TABLE api_key_logs (
  id BIGSERIAL PRIMARY KEY,
  key_id UUID REFERENCES api_keys_private.keys(id),
  endpoint TEXT,
  status INT,
  ip TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

**Lookup flow:**
1. Extract key from header: `sk_abc123xyz...`
2. Get prefix: `sk_abc12`
3. Query: `SELECT id, key_hash FROM keys WHERE key_prefix = $1`
4. bcrypt verify returned hash against full key
5. Never expose full key or hash in logs

### Rate Limiting Approaches for Single VPS

**In-Memory (simple, single instance only):**
- Zero external dependencies, <1ms overhead per request
- Unsuitable for distributed deployments (each server = separate cache)
- Cleanup: cron job removes expired keys every minute
- Use only if confident single-instance forever

**PostgreSQL-Based (sliding window, recommended):**
```sql
CREATE TABLE rate_limits (
  id BIGSERIAL PRIMARY KEY,
  key_id UUID NOT NULL REFERENCES api_keys_private.keys(id),
  window_start TIMESTAMP NOT NULL,
  request_count INT DEFAULT 1,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Unique constraint for idempotent updates
CREATE UNIQUE INDEX idx_rate_window ON rate_limits(key_id, window_start);
```

**Algorithm: Sliding Window + Token Bucket hybrid:**
- Each API key has max requests per time window (e.g., 1000/day)
- On request: calculate tokens regenerated since last check
- If tokens available, decrement and allow; else reject
- Database transaction handles concurrent requests (row lock)
- ~5-15ms overhead per request (negligible on single VPS)

**Fixed Window (simpler, but has burst risk):**
- Reset counter at fixed intervals (e.g., midnight UTC)
- Risk: burst at window boundaries (e.g., 11:59pm→12:01am)
- Lower DB overhead but worse UX; avoid unless minimal traffic

---

## 2. Next.js API Documentation

### Comparison Table

| Solution | Embed Route | Setup | Appearance | Best For |
|----------|-------------|-------|-----------|----------|
| **@scalar/nextjs-api-reference** | Yes (`/api/docs`) | ~5 min | Modern, interactive | Fast, professional, interactive |
| **next-swagger-doc** | Yes | JSDoc parsing | Traditional Swagger UI | Auto-generate from code comments |
| **next-openapi-gen** | Yes | CLI-based | Multiple UI options | Multi-UI flexibility |
| **Mintlify** | External (SaaS) | High setup | Beautiful/polished | Large orgs, marketing-focused |

### Recommended: Scalar for Embedded Docs

**Setup:**
```bash
npm install @scalar/nextjs-api-reference
```

**Route handler at `app/api/docs/route.ts`:**
```typescript
import { ApiReference } from '@scalar/nextjs-api-reference'

const config = {
  spec: {
    url: '/api/openapi.json', // or embed spec directly
  },
  theme: 'purple',
}

export const GET = ApiReference(config)
```

**Advantages:**
- Embeds in Next.js without external dependencies
- Supports direct spec embedding (no separate file needed)
- Works at app routes (`/api/v1/docs`)
- Modern UI, interactive playground included
- Compatible with Next.js 15+

### Alternative: Combine with `next-swagger-doc`
Generate OpenAPI spec from JSDoc + serve with Scalar:
```typescript
// app/api/openapi.json/route.ts
import { getOpenApiDocument } from 'next-swagger-doc'
export const GET = async () => {
  const spec = getOpenApiDocument(/* config */)
  return new Response(JSON.stringify(spec), {
    headers: { 'Content-Type': 'application/json' },
  })
}
```

---

## 3. API Key Tiering Database Design

### Schema Architecture
```sql
-- Subscription tiers
CREATE TABLE api_tiers (
  id INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL, -- 'Starter', 'Business', 'Enterprise'
  price_monthly DECIMAL(10, 2),
  requests_per_day INT NOT NULL,
  requests_per_minute INT,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO api_tiers (id, name, price_monthly, requests_per_day, requests_per_minute)
VALUES
  (1, 'Starter', 49.00, 1000, 50),
  (2, 'Business', 299.00, 10000, 500),
  (3, 'Enterprise', NULL, NULL, NULL);

-- Link keys to tiers
ALTER TABLE api_keys_private.keys ADD COLUMN tier_id INT REFERENCES api_tiers(id);

-- Enforce limits in application
CREATE VIEW key_limits AS
SELECT
  k.id,
  k.key_prefix,
  t.requests_per_day,
  t.requests_per_minute,
  u.merchant_id
FROM api_keys_private.keys k
JOIN api_tiers t ON k.tier_id = t.id
JOIN users u ON k.user_id = u.id;
```

### Tenant Isolation Strategy
- Each API key belongs to: User → Merchant (existing tables)
- Tier determines limits, not merchant or user tier
- Enforcement: middleware validates `user_id` owns the API key before processing

### Rate Limit Enforcement Logic
```typescript
// In Next.js middleware/route handler
const { requests_per_day, requests_per_minute } = await getLimits(apiKeyId)
const usage = await checkUsage(apiKeyId, { day: true, minute: true })

if (usage.day >= requests_per_day || usage.minute >= requests_per_minute) {
  return new Response('Rate limit exceeded', { status: 429 })
}
```

---

## 4. Security & Defense-in-Depth

- **CVE-2025-29927:** Middleware bypass via `x-middleware-subrequest` header manipulation
  - Solution: Verify auth at data access layer, not just middleware
- **Always validate inputs** with Zod/Yup before data operations
- **Audit logging** for all API key generation, rotation, revocation
- **Short-lived tokens** (if using JWT): ~60s lifespan + auto-refresh
- **HttpOnly cookies** if browser-based, Bearer tokens for APIs

---

## Summary Table

| Component | Recommendation | Rationale |
|-----------|---|---|
| **Key Storage** | bcrypt hash + prefix index | 250ms hash cost prevents brute-force; <10ms lookup |
| **Rate Limiting** | PostgreSQL sliding window | 5-15ms/request, single VPS friendly, scales to multi-instance |
| **API Docs** | @scalar/nextjs-api-reference at `/api/docs` | Embeds in app routes, modern UI, minimal setup |
| **Tier Schema** | Separate `api_tiers` table linked to keys | Decouples pricing from user/merchant model, flexible |
| **Auth Verification** | Data layer + middleware (defense-in-depth) | Mitigates middleware bypass vulnerabilities |

---

## Unresolved Questions
- PostgreSQL rate limit transaction contention at >1000 req/sec (may need connection pooling via PgBouncer)
- Enterprise tier custom limits (NULL values) — need admin UI for per-key adjustments?
- Key rotation strategy (issue new key, deprecate old, grace period?)

---

## Sources
- [Supabase API Key Management Guide](https://makerkit.dev/blog/tutorials/supabase-api-key-management)
- [Scalar API Reference for Next.js](https://scalar.com/products/api-references/integrations/nextjs)
- [Rate Limiting Algorithms Guide (API7)](https://api7.ai/blog/rate-limiting-guide-algorithms-best-practices)
- [Sliding Window Rate Limiter Design](https://arpitbhayani.me/blogs/sliding-window-ratelimiter/)
- [In-Memory Rate Limiting in Next.js (FreeCodeCamp)](https://www.freecodecamp.org/news/how-to-build-an-in-memory-rate-limiter-in-nextjs/)
- [Complete Next.js Security Guide 2025 (TurboStarter)](https://www.turbostarter.dev/blog/complete-nextjs-security-guide-2025-authentication-api-protection-and-best-practices)
- [next-swagger-doc (NPM)](https://www.npmjs.com/package/next-swagger-doc)
- [@scalar/nextjs-api-reference (NPM)](https://www.npmjs.com/package/@scalar/nextjs-api-reference)
- [SaaS Database Design (GeeksforGeeks)](https://www.geeksforgeeks.org/dbms/design-database-for-saas-applications/)
