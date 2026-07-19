# Spec — Send-loop resilience: retry with backoff on Resend 429/5xx

**Slug:** `alert-send-retry-backoff`
**Tier:** 3 `[goal]` — alert experience (plan-pass batch #10, 2026-07-19, item 4 of 7; a `[P1][goal]`)
**Date:** 2026-07-19

## Goal
Make `sendEmail` survive a transient Resend rate-limit (429) or server error (5xx)
by retrying once or twice with backoff — so a single mid-loop 429 no longer silently
loses that subscriber's digest for the whole period. An alert that doesn't reliably
send isn't an alert.

## Problem (verified by code read)
`src/lib/email.ts:74` `sendEmail` returns `{sent:false, reason:'error'}` on the **first**
non-OK response and never retries. The cron send loops
(`src/app/api/cron/alert-digest/route.ts`, `match-alert-digest/route.ts`) fire
back-to-back; Resend's default rate limit is ~2 req/s. As the list grows, a mid-loop send
will 429, that subscriber's email is dropped for the period (now *counted* in
`send_failures` but never retried). `grep 429/Retry-After/sleep` in `email.ts` is clean —
no retry exists today.

## Scope (small)
- **New** `src/lib/emailRetry.ts` — a pure, dependency-free decision module:
  - `isRetriableStatus(status)` → true for 429 and 5xx only.
  - `parseRetryAfterMs(header, nowMs)` → delta-seconds or HTTP-date → ms (null if absent/unparseable).
  - `planEmailRetry({status, attempt, retryAfter, maxAttempts, nowMs, rand})` →
    `{retry, delayMs}`. Honors `Retry-After` when present (clamped); else exponential
    backoff + jitter. `retry:false` when status non-retriable or attempts exhausted.
  - Exported constants: `MAX_SEND_ATTEMPTS`, `RETRY_BASE_MS`, `RETRY_MAX_MS`.
- **Edit** `src/lib/email.ts` `sendEmail` — wrap the fetch in a bounded retry loop that
  consults `planEmailRetry` on a non-OK response, `await sleep(delayMs)`, and retries.
- **New** `src/lib/emailRetry.test.ts` — exhaustive unit tests of the pure decision logic.
- **New** `src/lib/email.sendRetry.test.ts` — integration tests driving `sendEmail` with a
  stubbed `globalThis.fetch` (email.ts has zero runtime imports, so it imports cleanly).

## Acceptance criteria
1. `planEmailRetry` retries **only** 429 and 5xx; a 400/401/403/404/422 returns
   `{retry:false}` (bad-address hard-fail behavior preserved).
2. When a `Retry-After` header is present and parseable it is honored (clamped to
   `[0, RETRY_MAX_MS]`); otherwise the delay is exponential-backoff-with-jitter, bounded
   by `RETRY_MAX_MS`.
3. Retries are bounded: `planEmailRetry` returns `{retry:false}` once `attempt >= MAX_SEND_ATTEMPTS`.
4. `sendEmail` end-to-end: a 429-then-200 sequence returns `{sent:true}` and calls fetch
   twice; a persistent 429 returns `{sent:false, reason:'error'}` after exactly
   `MAX_SEND_ATTEMPTS` fetches; a 400 returns error after **one** fetch (no retry).
5. The `no-key` no-op path and the thrown-network-error `catch` path are **unchanged**
   (still return immediately, no retry) — callers' `send_failures` counting stays correct
   (a failure is counted only when the *final* result is still an error).
6. `npx next build` + `tsc --noEmit` green; full `src/**/*.test.ts` suite green with the
   new tests added; qa-smoke exit 0.

## Out of scope
- **Cross-loop pacing / a delay between successive sends** — the batch item also mentions
  gentle inter-send pacing; that touches every cron send loop and is a separate, riskier
  slice. Retry (recovery) is the higher-leverage half and ships alone this cycle; pacing
  (prevention) is the next slice.
- Retrying thrown network errors (fetch rejects) — kept as today's immediate error return
  to stay strictly on the 429/5xx spec; can be a follow-up.
- Any schema change, any email-template/markup change, any new capture point or analytics.
