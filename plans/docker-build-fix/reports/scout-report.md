# Docker Build Failure Analysis Report

## Executive Summary

The GitHub Actions Docker build fails because the Dockerfile and workflow do not pass the `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` build argument, but the application uses this env var at **module level** during static generation. Since `NEXT_PUBLIC_*` vars are inlined into the JS bundle during build time, their absence causes a build failure after ~37 seconds.

**Root Cause**: Module-level initialization of `stripePromise` with an undefined env var.

---

## Critical Issues Found

### ISSUE 1: Module-Level Env Var Usage (HIGH SEVERITY)

File: `/d/DU AN WEBSITE GAME/landing-page/app/checkout/pay/page.tsx` (line 10)

```
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
```

**Problem**:
- This code runs at module parse time, not at runtime
- The component is marked "use client" BUT Next.js still needs to process it during build
- When Docker builds without NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY set, the env var is undefined
- The non-null assertion (!) forces TypeScript to ignore the potential undefined value
- loadStripe(undefined) likely fails or causes Stripe initialization errors
- This blocks the entire npm run build in the Docker builder stage

**Why local npm run build works**:
- Your .env.local file (gitignored) contains STRIPE_PUBLISHABLE_KEY=pk_test_...
- Next.js picks it up and inlines the real value
- Docker does not have this file, so the env var is empty

---

### ISSUE 2: Missing Dockerfile ARG Declarations (HIGH SEVERITY)

File: `/d/DU AN WEBSITE GAME/landing-page/Dockerfile` (lines 8-13)

```
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
```

**Problem**:
- No ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY before the RUN npm run build step
- Without ARG declaration, the env var is unavailable during build
- Next.js requires build-time knowledge of all NEXT_PUBLIC_* vars
- Build args must be explicitly declared in Dockerfile to be used

**Missing ARG declarations**:
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (critical for checkout page)
- NEXT_PUBLIC_APP_URL (used in checkout and portal routes)

---

### ISSUE 3: Incomplete Build Args in GitHub Actions Workflow (HIGH SEVERITY)

File: `/d/DU AN WEBSITE GAME/landing-page/.github/workflows/deploy.yml` (lines 37-47)

Current build-args only pass:
```
NEXT_PUBLIC_APP_URL
```

**Problem**:
- Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY entirely
- The workflow secrets need to exist AND be passed to Docker
- No error message shown because the build arg just resolves to empty string

---

### ISSUE 4: No Dynamic Rendering Declaration (MEDIUM SEVERITY)

File: `/d/DU AN WEBSITE GAME/landing-page/app/checkout/pay/page.tsx`

**Missing Export**:
```
export const dynamic = "force-dynamic";
```

**Why this matters**:
- The page is marked "use client" but without export const dynamic, it is treated as static by default
- Even though it is a client component, Next.js attempts static generation
- This causes Stripe initialization to happen at build time, not runtime
- Should either add export const dynamic = "force-dynamic" OR move stripe initialization to useEffect

---

### ISSUE 5: Docker-Compose Runtime Configuration (LOW SEVERITY)

File: `/d/DU AN WEBSITE GAME/landing-page/docker-compose.yml` (lines 7-8)

```
env_file: .env.production
```

**Issue**:
- Relies on .env.production file on the server
- File is not tracked in git, must be created manually on deployment server
- Runtime config is correct, but build-time config is broken
- This is why Docker build fails BEFORE the image even runs

---

## Files Analyzed

- Dockerfile: Missing ARG declarations
- app/checkout/pay/page.tsx: Module-level env var usage
- app/checkout/success/page.tsx: Client component, safe
- .github/workflows/deploy.yml: Build args incomplete
- next.config.ts: Config correct, no build suppressions
- docker-compose.yml: Runtime config fine
- .env.production.example: Correctly documents needed vars
- lib/stripe.ts: Server-side lazy init, safe
- app/layout.tsx: Root layout, no env var usage

---

## Summary Table

| Finding | Status |
|---------|--------|
| Build fails in Docker | CONFIRMED |
| Module-level init without fallback | CONFIRMED |
| Dockerfile missing ARG | CONFIRMED |
| Workflow missing build arg | CONFIRMED |
| Fails at ~37 seconds (build phase duration) | LIKELY |

