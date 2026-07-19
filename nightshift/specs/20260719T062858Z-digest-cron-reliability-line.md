# digest-cron-reliability-line

## Goal
Add a "Cron reliability" section to the Monday admin alert-funnel email so the human can
tell a quiet week (no signups, nothing broken) apart from a silently broken digest cron,
using data `alert_cron_runs` already records.

## Scope
- `src/lib/alertCronHealth.ts` — new fail-soft `getCronRunsSince(sinceMs)` helper (mirrors
  `getRecentCronRuns`'s try/catch-empty-on-error convention), used to pull the last 14
  days of runs for a week-over-week comparison.
- `src/lib/alertFunnelWeekly.ts` — extend `AlertFunnelWeeklySnapshot` with cron-reliability
  fields (distinct UTC days the cron ran this week out of 7, run counts, emails-sent WoW,
  average run duration this week, and whether any run data exists at all) computed from
  `getCronRunsSince`.
- `src/lib/email.ts` — `buildAdminAlertFunnelEmail` renders a new "Cron reliability"
  section (HTML + text): "ran N/7 days" (flagged if under 7), emails sent this week vs
  last week, average run duration. Honest empty state when no `alert_cron_runs` rows
  exist yet (same ambiguous-but-honest copy `/admin/alerts`'s existing panel already
  uses — table not migrated vs. cron hasn't run yet look the same and always have).
- `src/app/api/dev/email-preview/admin-alert-funnel/route.ts` — update the fixture
  snapshot with the new fields so the preview renders the new section.
- `src/lib/email.test.ts` — new tests for the populated and empty-state renders.

## Out of scope
- The `send_failures` per-run column this backlog item also names — that requires a new
  additive `alert_cron_runs.send_failures` column AND wiring failure-counting through the
  cron's several send loops, a materially bigger and riskier change. Left as the explicit
  follow-up in the backlog item (not struck).
- No change to `/admin/alerts`'s existing "Last run" health panel — this item only asks
  for the reliability line in the Monday email.
- No schema change in this slice — every field used already exists on `alert_cron_runs`.

## Acceptance criteria
- `getCronRunsSince` returns `[]` (never throws) on any error, matching the existing
  fail-soft convention in the same file.
- `AlertFunnelWeeklySnapshot` carries the new cron fields; `getAlertFunnelWeeklySnapshot`
  populates them from real `alert_cron_runs` rows, honest zeros/null when none exist.
- The Monday email (HTML + text) shows a "Cron reliability" section: "ran N/7 days" (with
  a visual flag when N < 7), "Emails sent this week: X (WoW delta)", "Avg run duration:
  Ys" — and a distinct honest empty state when no run rows exist at all.
- Dev email-preview route (`/api/dev/email-preview/admin-alert-funnel`) renders the new
  section with fixture data.
- `npx tsc --noEmit` and `npx next build` both exit 0; full test suite passes including
  new tests.
