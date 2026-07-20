# alert-test-row-sweep

**Tier:** `[P1][goal]` (batch #13, top of the un-shipped queue — GOAL.md "never spam" /
data-integrity floor under the alert experience). No `[bug]`/`[want]` items are
actionable this cycle (last changelog entry PASSed; the two open `[P1][want]` items —
"Save this search" auth-wall reconciliation and the collection-layout redesign — both
explicitly await a human product/design call, per BACKLOG.md).

## Goal
Close the one confirmed gap in the existing `@example.com` test-data safety net: the
`sweep_test_accounts()` DB function (called nightly by the frozen `nightshift/bin/
check-listings-health.mjs`) only deletes `alerts` rows that belong to a matching
`auth.users` row — but alerts are an **email-only, no-account-required** capture, so a
QA cycle's throwaway `qa-<slug>@example.com` alert row with no signup is never reached.
Add a second, independent sweep — scoped to the `alerts` table directly by email
pattern + age, no `auth.users` join required — to the daily `alert-digest` cron.

## Scope
- New `src/lib/testAlertSweep.ts`: pure, unit-testable matcher (`isSweepableTestAlertEmail`)
  + cutoff helper (`sweepCutoffIso`) — no DB code, so it's cheaply testable.
- `src/app/api/cron/alert-digest/route.ts`: new `sweepOrphanTestAlerts(supabase)` step
  run once near the top of `GET`, before any real send logic. Selects up to 500
  `alerts` rows matching `email ilike '%@example.com'` AND `created_at` older than 24h,
  defensively re-filters the returned rows in JS with the pure matcher (belt-and-
  suspenders — never trust the DB-side `ilike` alone), deletes by exact `id` list, and
  logs every deleted `id`/`email` to the cron's console output. Never touches a row
  whose email doesn't match the pattern; never blocks/throws into the real digest send
  if the sweep itself errors (fail-soft, same convention as every other step in this
  route).
- Record the swept count on the existing `alert_cron_runs` health-log row as a new
  optional column (`swept_test_alerts`), same fail-soft "retry without the column if
  it's not migrated yet" pattern already used for `send_failures`/`deferred_sends`/
  `self_check_ok`. ⚠️ Additive schema change in `supabase/schema.sql`, flagged for
  human apply — until applied, the insert silently drops the column (current, safe
  behavior fully preserved).
- New `src/lib/testAlertSweep.test.ts` unit tests on the matcher (real `@example.com`
  variants, non-example domains, mixed case, subdomain lookalikes) and the cutoff math.

## Out of scope
- Not touching `nightshift/bin/check-listings-health.mjs` or `sweep_test_accounts()`
  (frozen harness file / already-working existing sweep for user-linked rows).
- Not sweeping `feedback`/other tables — `alerts` is the one confirmed gap; no other
  email-only table was found referencing alert rows without a user FK.
- No UI surfacing of the new column on `/admin/alerts` this cycle (console-log +
  run-log column is enough to satisfy "log every deleted row" — a future slice can
  render it if useful).
- Not attempting the DDL apply myself — same human-apply convention as every other
  `alerts.*`/`alert_cron_runs.*` column in this file.

## Acceptance criteria
- `npx next build` + typecheck pass clean.
- `testAlertSweep.test.ts` passes and covers: matches `foo@example.com`,
  `FOO@EXAMPLE.COM`, `qa-slug-123@example.com`; rejects `foo@notexample.com`,
  `foo@example.com.evil.com`, `foo@example.org`.
- Live-verified against the real (shared) Supabase DB: a throwaway
  `qa-alert-test-row-sweep-old@example.com` alert row backdated >24h is deleted by
  `sweepOrphanTestAlerts` when the cron route is invoked; a control row
  `qa-alert-test-row-sweep-fresh@example.com` created just now (not yet 24h old) is
  left untouched, then manually cleaned up.
- `/admin/alerts` still renders with no new console errors after the schema/cron
  change (qa-smoke at 1280 + 375px).
- No regression to any existing alert-digest send behavior (the sweep runs before,
  and independently of, the send loop; existing counts/logs unchanged).
