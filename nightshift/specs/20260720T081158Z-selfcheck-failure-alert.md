# selfcheck-failure-alert

## Goal
When the daily capture-funnel self-check (`alertCaptureSelfCheck.ts`) fails, send admins
an immediate dedicated heads-up email instead of only a passive line in Monday's funnel
summary, so a mid-week breakage doesn't sit undetected for up to 6 days.

## Scope
- `src/lib/alertCaptureSelfCheckHistory.ts` — add a pure, unit-testable
  `shouldSendCaptureSelfCheckAlert(priorRuns, todayOk)` helper: sends on the transition
  into failure (previous run passed/unmigrated → today failed), then again every 3rd
  consecutive failed day (gentle re-send, not a daily repeat).
- `src/lib/email.ts` — new `buildAdminCaptureSelfCheckFailureEmail(opts)` builder, short
  and internal-only (mirrors `buildManageLinkEmail`'s simple single-CTA style), naming the
  failing step and linking to `/admin/alerts`.
- `src/app/api/cron/alert-digest/route.ts` — after the existing self-check block, on a
  failure, read the last 7 `alert_cron_runs` (via `getRecentCronRuns`, called BEFORE this
  run's own row is inserted so it's genuinely "prior" runs) and send the heads-up through
  the existing `ADMIN_EMAILS`/`SendPacer` plumbing when `shouldSendCaptureSelfCheckAlert`
  says so. Small refactor: extract the existing inline `ADMIN_EMAILS` parsing (currently
  duplicated inline in `sendMondayAdminFunnelSummary`) into one `getAdminRecipientEmails()`
  helper shared by both send functions.
- Unit tests added to `src/lib/alertCaptureSelfCheckHistory.test.ts`.

## Acceptance criteria
- A failing self-check on a run whose immediately-prior run passed (or is unmigrated)
  sends one admin email per configured `ADMIN_EMAILS` address, naming the failing step.
- A failing self-check on the 2nd consecutive red day does NOT send (avoids daily spam).
- A failing self-check on the 3rd/6th/9th... consecutive red day DOES send again (gentle
  reminder for a persistent failure).
- No admin emails configured (`ADMIN_EMAILS` empty) → no send attempted, no error.
- A passing self-check never sends this email (Monday's funnel summary already covers
  recovery reporting).
- The heads-up send can never affect the digest sends that already completed in the same
  run (wrapped in try/catch, mirrors `sendMondayAdminFunnelSummary`'s fail-soft pattern);
  its failures are counted into the run's existing `sendFailures` tally.
- `npx tsc --noEmit` and `npx next build` stay green; existing self-check/history tests
  stay green; new tests cover the send-decision helper.

## Out of scope
- Any change to the self-check probe itself (`alertCaptureSelfCheck.ts`) or the Monday
  funnel email.
- A "recovered" notification email (out of scope per the backlog item's own wording).
- Rendering self-check status on `/admin/alerts` (separate queued item:
  "Send-health block on `/admin/alerts` — last-7-runs table").
