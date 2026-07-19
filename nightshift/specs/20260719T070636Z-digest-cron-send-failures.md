# digest-cron-send-failures

## Goal
Track and surface real email-send failures per `alert-digest` cron run, so the admin
Monday summary can tell "quiet week" apart from "emails are silently failing to send."

## Scope
- `src/app/api/cron/alert-digest/route.ts`: count a send as a failure at every
  `sendEmail(...)` call site when `result.sent` is false and `result.reason !== 'no-key'`
  (missing API key is a deliberate dev/staging no-op, not a real failure). Sum failures
  across the stranded-pending-reminder loop, the widen-suggestion loop, the Monday admin
  funnel-summary send, the combined-digest loop, and the listing-unavailable loop. Insert
  the total as a new `send_failures` column on the `alert_cron_runs` health-log row,
  retrying the insert without the column if it isn't migrated live yet (same fail-soft
  convention as every other `alerts.*`/`alert_cron_runs.*` column in this codebase).
- `src/lib/alertCronHealth.ts`: add `sendFailures: number | null` to `AlertCronRun` +
  `toRun`, reading straight off `select('*')` (absent pre-migration → null, never 0
  fabricated as real).
- `src/lib/alertFunnelWeekly.ts`: add `cronSendFailuresThisWeek: number` (sum across this
  week's logged runs — 0 both when genuinely zero failures AND when unmigrated, same
  ambiguity `cronRunsRecorded` already documents for the rest of this panel) to
  `AlertFunnelWeeklySnapshot`.
- `src/lib/email.ts`: render the failure count in the existing "Cron reliability" block
  (Monday admin email, HTML + text) — flag it visually when > 0.
- `supabase/schema.sql`: additive `alter table alert_cron_runs add column if not exists
  send_failures int not null default 0;` with a `⚠️ HUMAN ACTION REQUIRED` comment,
  matching every prior column-migration block in this file.

## Acceptance criteria
- `npx tsc --noEmit` and `npx next build` both exit 0.
- A `sendEmail` failure (not `no-key`) at any of the 5 send sites increments the run's
  logged `send_failures` count; the row insert still succeeds pre-migration (retries
  without the column).
- The Monday admin funnel email's "Cron reliability" section shows failures this week,
  with an honest 0 (not fabricated) when the column isn't migrated or genuinely zero.
- No change to send behavior itself — this is counting/logging only, never blocks or
  retries a send.
- `qa-smoke.mjs` passes for `/admin/alerts` (the one page this touches indirectly via the
  email-generation code path — no new route).
- Full `node --experimental-strip-types --test` suite passes.

## Out of scope
- Building the "instant" alert cron (separate item, blocked on a human Vercel-plan call).
- Any UI surfacing on `/admin/alerts` itself beyond the existing "Last run" panel (this
  slice is the Monday email only, matching the item's own scoping note in BACKLOG.md).
- Alerting/paging on failures — this is visibility only.
