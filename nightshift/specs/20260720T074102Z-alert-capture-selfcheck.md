# Daily capture-funnel self-check

## Goal
Add a synthetic subscribe → confirm → delete probe to the daily alert-digest cron so a
broken subscribe/confirm chokepoint (bad deploy, schema drift) surfaces the same day in
the admin funnel email, instead of only showing up as an unexplained zero-signup week.

## Scope
- New `src/lib/alertCaptureSelfCheck.ts`: reserved test email constant + a
  `runCaptureFunnelSelfCheck()` that inserts a pending `alerts` row, flips it to
  `confirmed`, deletes it, and asserts each step — plus a pure
  `summarizeSelfCheckHistory()` helper for the "N of last 7 failed" rollup (unit
  testable without a DB).
- `src/app/api/cron/alert-digest/route.ts`: call the self-check once, fail-soft, right
  before the existing `alert_cron_runs` log write; add two columns to that insert
  (graceful column-drop retry, same pattern as `send_failures`/`deferred_sends`).
- `src/lib/alertCronHealth.ts`: surface the two new optional columns on `AlertCronRun`.
- `src/lib/alertFunnelWeekly.ts`: compute the last-7-run self-check rollup for the
  snapshot; add a `.neq('email', ...)` guard on the main funnel query so the reserved
  address can never leak into a subscriber count even if a cleanup step fails mid-run.
- `src/lib/alertScoreboard.ts`: same `.neq('email', ...)` guard on the `/admin/alerts`
  on-demand scoreboard's main query.
- `src/lib/email.ts`: one new "Capture self-check" line in `buildAdminAlertFunnelEmail`
  (HTML + text), three honest states (not-migrated / PASS / FAILED at step).
- `supabase/schema.sql`: additive `alter table alert_cron_runs add column if not exists
  self_check_ok boolean` / `self_check_step text` (⚠️ human-apply, fails soft until then).

## Acceptance criteria
- The self-check never sends a real email (no `sendEmail` call anywhere in its path).
- The self-check row is deleted before the function returns on every path (success or
  failure at any step), and a leftover row from a prior failed run is cleaned up before
  a fresh insert (self-healing).
- The reserved test address is excluded from `alertFunnelWeekly`'s and
  `alertScoreboard`'s subscriber-count queries.
- `alert_cron_runs` insert still succeeds even when the two new columns aren't migrated
  live (retry-without-column, same as every other optional column on that table).
- The admin funnel email renders the three honest self-check states with no fabricated
  numbers.
- `next build` + `tsc --noEmit` clean; full unit test suite green; new tests cover
  `summarizeSelfCheckHistory` and the three email states.

## Out of scope
- Actually invoking the live cron route during QA (writes to the shared prod `alerts`
  table on a schedule already — not something to trigger manually mid-cycle).
- Any change to the real subscribe/confirm user-facing code paths (`actions.ts`,
  `/api/alerts/confirm/route.ts`) — the self-check exercises the same table/columns
  directly via the admin client rather than calling those functions, keeping this
  cycle's blast radius off live user code.
- Alerting/paging on repeated self-check failures beyond the email line (future slice).
