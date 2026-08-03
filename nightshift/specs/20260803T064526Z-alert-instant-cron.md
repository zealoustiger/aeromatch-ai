# Spec — Near-instant new-listing alerts (`alert-instant-cron`)

## Goal
Give buyers a real "Instant" alert cadence: a new lightweight cron
(`/api/cron/alert-instant`, every ~15 min) that emails `frequency='instant'`
subscribers new-listing matches since their `last_digest_at`, reusing the daily
digest's existing counters + email builders, and stamps `last_digest_at` so the
daily cron never double-sends.

## Scope (files expected to touch)
- `src/lib/alertFrequency.ts` — add `'instant'` to `AlertFrequency` + its helpers
  (normalize, interval, next-lighter, describe-last/next). Honest instant copy.
- `src/lib/alertFrequency.test.ts` — cover the new `'instant'` cases.
- `src/app/api/cron/alert-digest/route.ts` — additive `export` on the reusable
  parse/count/sample/mark helpers; SKIP `frequency==='instant'` in the daily
  loop (instant is owned by the new route — never double-send).
- `src/app/api/cron/alert-instant/route.ts` — NEW route (the instant send path).
- `vercel.json` — add the new cron on a 15-min schedule.
- `src/components/FrequencyToggle.tsx` — add "Instant" to the cadence cycle with
  honest "checked about every 15 min" copy.
- `src/app/alerts/manage/page.tsx` — drop the now-obsolete `InstantInterestNudge`
  demand probe (instant is a real, selectable cadence now).
- `supabase/schema.sql` — additive `alerts_frequency` CHECK-widening migration to
  allow `'instant'`. ⚠️ HUMAN-APPLY ONLY (shared prod/staging DB). Code fail-soft.

## Acceptance criteria
1. `npx next build` + `npx tsc --noEmit` pass; `alertFrequency.test.ts` passes.
2. New `/api/cron/alert-instant` route: for each `frequency='instant'`
   confirmed/active alert, counts new listings since `last_digest_at` (reusing
   the digest's `parseSourcePath`/`countNew`/sample fetchers), sends via the
   existing `buildAlertDigestEmail`, and stamps `last_digest_at` via the shared
   `markDigestSent`. Same `CRON_SECRET` auth pattern as the daily digest.
3. FAIL-SOFT: if the `frequency` column / `'instant'` CHECK value isn't migrated
   live yet, the route returns a clean 200 (no rows, no throw) and the toggle's
   "Instant" selection is a no-op (existing `updateAlertFrequency` drop-and-retry)
   — never an error, never a throw.
4. The daily `alert-digest` cron never processes an `frequency='instant'` alert
   (never double-sends the same listings).
5. `FrequencyToggle` offers "Instant" in its cycle with honest copy; no fabricated
   cadence claim (says "checked about every 15 min", not "real-time").
6. `vercel.json` carries the new cron entry; near-free when zero instant alerts
   exist (one cheap indexed query, early-out).

## Out of scope
- Price-drop matching in the instant route (this slice is new-listings only, per
  the backlog title; drops stay on the daily digest cadence). Noted as follow-up.
- Offering "Instant" at capture time (`AlertSignup`) — manage-page toggle only.
- Applying the SQL migration (human-apply; additive CHECK widening only).
- Any change to auth/admin/ingest/env/secrets.
