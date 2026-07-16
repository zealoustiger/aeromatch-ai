# alert-scoreboard-trend

## Goal
Add an 8-week subscribed-vs-confirmed trend sparkline to `/admin/alerts` so the alert
funnel can be judged week-over-week (GOAL.md's honesty rule), not just this-week-vs-
last-week as today.

## Scope
- `src/lib/alertScoreboard.ts` — add a pure, unit-testable `buildWeeklyTrend()` helper
  that buckets existing rows (`created_at`, `confirmed_at` — both already selected,
  no schema change) into 8 weekly buckets; wire it into `getAlertScoreboard()`'s
  returned snapshot as `weeklyTrend`.
- `src/lib/alertScoreboard.test.ts` — new unit tests for `buildWeeklyTrend()`.
- `src/app/admin/alerts/page.tsx` — render a small 8-bar sparkline (subscribed +
  confirmed per week) in a new section on the existing scoreboard panel.

## Acceptance criteria
- `buildWeeklyTrend()` is a pure function (no DB/network calls) covered by unit tests:
  correct bucketing of `created_at`/`confirmed_at` into 8 weeks, rows older than 8
  weeks excluded, null/invalid dates ignored, oldest-to-newest ordering.
- `/admin/alerts` renders a new "8-week trend" section with 8 bars per series
  (subscribed, confirmed), an honest note that unsubscribe timestamps aren't
  recorded in the `alerts` table today (no fabricated unsubscribed trend), and a
  "not enough data" fallback when all 8 weeks are zero.
- No new DB columns or migrations — built entirely from `created_at`/`confirmed_at`,
  which the scoreboard already selects.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- QA smoke passes on `/admin/alerts` at desktop 1280 + mobile 375 (HTTP 200, zero
  app-origin console errors, zero horizontal overflow).
- No new PostHog event needed (this is internal measurement, not a new capture point).

## Out of scope
- An unsubscribed-over-time trend (no timestamp column exists for it — would require
  fabricating data, which GOAL.md's honesty rule forbids).
- Any change to the `alerts` table schema.
- The "real instant alerts" item (separately blocked on an unconfirmed Vercel
  cron-tier plan limit — needs a human call, not attempted this cycle).
