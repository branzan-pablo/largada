# Security Audit Report — Largada MVP

**Date:** 2026-04-06
**Scope:** Authentication and Payment flows
**Auditor:** Automated (Claude Code)

---

## Executive Summary

Security audit of the authentication (Supabase Auth + OAuth) and payment (AbacatePay) flows. **5 critical**, **2 high**, and **3 medium** vulnerabilities were identified. Code fixes were applied for 7 of the 10 findings. 3 items require manual action or infrastructure changes.

---

## Findings

### CRITICAL

#### C1 — Secrets in Git History
**Status:** PENDING (manual action required)
**Location:** git history (commits `63303ad`, `55cb79a`)

`.env.production` was committed with production secrets (Supabase service role key, AbacatePay API key, Strava secret, VAPID private key, CRON_SECRET) and later removed. The `.gitignore` now correctly excludes these files, but the secrets remain in git history.

**Required actions:**
1. Rotate ALL production secrets immediately:
   - Supabase: Dashboard > Settings > API > Regenerate service role key
   - AbacatePay: Dashboard > API Keys > Generate new key
   - Strava: API settings > Regenerate client secret
   - VAPID: Generate new keypair via `web-push generate-vapid-keys`
   - CRON_SECRET: Generate new value via `openssl rand -hex 32`
2. Update all secrets in Vercel environment variables
3. Optionally clean git history: `git filter-repo --invert-paths --path .env.production --path .env.local`
   - WARNING: This rewrites history and requires a force push

---

#### C2 — Webhook HMAC Signature Was Optional
**Status:** FIXED
**File:** `src/lib/payments/webhook.ts`

The `verifyWebhook()` function silently skipped HMAC verification when the `X-Webhook-Signature` header was absent. Only the webhook secret (Layer 1) protected the endpoint.

**Fix:** Both layers are now mandatory. Missing signature header throws `AbacatePayWebhookError`.

---

#### C3 — Order Update Without Status Constraint
**Status:** FIXED
**File:** `src/app/api/payments/webhook/route.ts`

The primary order update query used only `.eq("abacatepay_id", ...)` without checking status. An already-PAID order could be re-processed by a replayed webhook.

**Fix:** Added `.eq("status", "PENDING")` to ensure only PENDING orders transition to PAID.

---

#### C4 — No Payment Amount Validation
**Status:** FIXED (logging)
**File:** `src/app/api/payments/webhook/route.ts`

The webhook accepted `paidAmount` from the payload without comparing it to the original order amount. A compromised or misconfigured payment gateway could mark under-paid orders as PAID.

**Fix:** After updating the order, the system now compares `paidAmount` against the order's stored `amount`. A mismatch is logged as an error with full details for investigation. The payment is not blocked (AbacatePay may round centavos), but the discrepancy is visible in logs.

---

#### C5 — Multi-step Operations Without Atomicity
**Status:** MITIGATED
**File:** `src/app/api/payments/webhook/route.ts`

Order update, customer creation, race promotion, and subscription activation were independent queries. A failure in any step could leave the database in an inconsistent state.

**Fix:** Added a defensive guard — if no order was updated (primary or fallback), all side-effects (customer persist, promotion, subscription) are skipped with a warning log. Supabase JS SDK does not support multi-statement transactions, so full atomicity is not possible without migrating to Supabase RPC (Postgres functions).

**Recommendation:** For critical flows, consider implementing a Postgres function via `supabase rpc()` that wraps the order update + promotion/subscription in a real transaction.

---

### HIGH

#### H1 — CSP Allows `unsafe-eval`
**Status:** FIXED
**File:** `next.config.ts`

The Content Security Policy included `'unsafe-eval'` in `script-src`, allowing `eval()` execution and weakening XSS protection.

**Fix:** Removed `'unsafe-eval'` from `script-src`. `'unsafe-inline'` remains for both `script-src` and `style-src` because Next.js requires inline scripts/styles. For full CSP hardening, consider migrating to nonce-based CSP in the future.

---

#### H2 — In-Memory Rate Limiting
**Status:** DOCUMENTED (infrastructure change required)
**File:** `src/lib/rate-limit.ts`

The rate limiter uses an in-memory `Map`. On Vercel serverless, each instance has its own Map, and cold-starts reset all counters. Rate limiting is best-effort only.

**Recommendation:** Migrate to `@upstash/ratelimit` + Upstash Redis for distributed, persistent rate limiting. This requires:
1. `pnpm add @upstash/ratelimit @upstash/redis`
2. Create Upstash Redis instance
3. Replace `rateLimit()` implementation

---

### MEDIUM

#### M1 — Weak Password Minimum (6 characters)
**Status:** FIXED
**File:** `src/lib/validations.ts`

Password minimum was 6 characters, below OWASP recommendation of 8+.

**Fix:** Increased to 8 characters for both `loginSchema` and `registerSchema`.

---

#### M2 — No Rate Limiting on Public Endpoints
**Status:** DOCUMENTED
**Files:** `src/app/api/races/route.ts`, `src/app/api/cities/search/route.ts`

Public API endpoints (`/api/races` GET, `/api/cities/search`) have no rate limiting and could be abused for DoS or scraping.

**Recommendation:** Add IP-based rate limiting after migrating to distributed rate limiter (H2).

---

#### M3 — Webhook Secret via Query Parameter
**Status:** FIXED
**File:** `src/app/api/payments/webhook/route.ts`

The webhook endpoint accepted the secret via URL query parameter (`?webhookSecret=...`) as a legacy fallback. Query parameters can appear in access logs, referrer headers, and browser history.

**Fix:** Removed query parameter support. The secret is now only accepted via `Authorization: Bearer` header.

**NOTE:** Update AbacatePay webhook configuration to send the secret in the Authorization header if it was using the query parameter.

---

## Confirmed Good Practices

These areas were audited and found to be secure:

| Area | Implementation |
|---|---|
| Session management | Supabase SSR with HttpOnly cookies, automatic refresh |
| Secret comparison | `crypto.timingSafeEqual()` used everywhere (cron, webhooks, auth) |
| Idempotency | UNIQUE constraint on `payment_events.event_id` |
| Card data | Not stored — delegated entirely to AbacatePay |
| HTTP headers | HSTS (2y + preload), X-Frame-Options DENY, nosniff, strict Referrer-Policy |
| Input validation | Zod schemas on all forms and API inputs |
| SQL injection | Supabase SDK with parameterized queries; LIKE wildcards escaped |
| Admin routes | `requireAdmin()` with role check on all admin API routes + middleware |
| CSRF (OAuth) | State parameter + cookie verification on Strava OAuth |
| Cron protection | Bearer token with timing-safe comparison |
| File uploads | MIME whitelist (jpeg/png/webp), 5MB limit, 1200px max dimension |
| Race promotion | Ownership check via `eq("created_by", user_id)` |
| XSS | Single `dangerouslySetInnerHTML` safely used with `JSON.stringify` for JSON-LD |

---

## Future Recommendations

| Priority | Recommendation |
|---|---|
| High | Rotate all exposed secrets (C1) |
| High | Migrate rate limiting to Redis (H2) |
| Medium | Implement nonce-based CSP to replace `unsafe-inline` |
| Medium | Add rate limiting to public endpoints (M2) |
| Medium | Implement audit logging for sensitive operations (payments, admin actions) |
| Low | Add MFA/2FA support via Supabase Auth |
| Low | Add password complexity requirements (uppercase, numbers, symbols) |
| Low | Consider Postgres RPC functions for transactional payment operations (C5) |
