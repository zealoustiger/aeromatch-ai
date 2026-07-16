# Spec: alert-cron-run-log

## Goal
Give `/admin/alerts` a real "Last run" health panel for the `alert-digest` cron so a
silently-broken digest send is visible instead of discovered via subscriber complaints.

## Scope
- `supabase/schema.sql`: additive `alert_cron_runs` table (⚠️ human-apply DDL, same
  precedent as every other `alerts.*`/`airport_facility_ratings` migration this loop has
  shipped) — one summary row per cron pass: `processed`, `sent`, `emails_sent`, `skipped`,
  `unparseable`, `not_due`, `reminders_sent`, `widen_suggestions_sent`, `duration_ms`,
  `created_at`.
- `src/app/api/cron/alert-digest/route.ts`: at the end of the `GET` handler, insert one
  row with the real counters already computed (`total`, `sent`, `emailsSent`, `skipped`,
  `unparseable`, `notDue`, `remindersSent`, `widenSuggestionsSent`) + wall-clock duration.
  Fails soft (try/catch, log + continue) if the table isn't migrated live yet — never
  breaks the actual digest send.
- New `src/lib/alertCronHealth.ts`: `getLastCronRun()` (most recent row) +
  `getRecentCronRuns(n)` (small history) via the admin client. Returns `null`/`[]` on any
  error, including a not-yet-migrated table (same fail-soft convention as
  `facilityRatings.ts`).
- `src/app/admin/alerts/page.tsx`: new "Cron health" section (admin-gated, existing
  layout) — last-run timestamp + counts, and a red "no successful run in >36h" flag when
  the most recent row is stale or no rows exist at all. Honest empty state when the table
  has zero rows (new table / not migrated yet).

## Acceptance criteria
- `alert_cron_runs` table defined additively in `schema.sql`, clearly flagged
  ⚠️ HUMAN ACTION REQUIRED.
- The cron route still returns 200 and sends real digest emails unaffected if the new
  table doesn't exist yet on the live DB (fail-soft insert, verified via a live query
  showing the table doesn't exist today).
- `/admin/alerts` renders a new "Cron health" panel: on this sandbox's DB (table not yet
  applied) it shows an honest "no run data yet" state, not an error or fabricated numbers.
- No change to `src/app/admin/**` auth gating, `src/app/auth/**`, or any FREEZE'd file.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- QA smoke passes on `/admin/alerts` (desktop 1280 + mobile 375, zero app console errors,
  zero overflow).

## Out of scope
- Actually running/scheduling anything differently — this only logs+surfaces existing
  cron runs, no behavior change to sends.
- Alerting/paging (e.g. email-the-human on a stale run) — just the visible panel.
- The separate, still-blocked "near-instant alerts" item.
