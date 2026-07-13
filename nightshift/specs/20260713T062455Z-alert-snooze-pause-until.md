# alert-snooze-pause-until

## Goal
Let a subscriber "Snooze" an alert for 30 days instead of only an indefinite Pause, with an honest resume date shown and a real auto-resume — no fake "we'll check back soon" copy.

## Scope
- `supabase/schema.sql` — additive `alerts.paused_until timestamptz` column (⚠️ HUMAN ACTION doc comment, same pending-DDL pattern as `frequency`/`price_drop_opt_in`).
- `src/lib/alertSnooze.ts` (new) — pure, unit-tested helpers: resolve a +30-day ISO timestamp from `nowIso`, format it for display copy, and check whether a stored `paused_until` has passed.
- `src/app/actions.ts`:
  - New `snoozeAlert(id, token?)` — sets `status: 'paused'`, `paused_until: <+30d>`; on a missing-column error, retries as a plain pause (graceful degrade, same precedent as `price_drop_opt_in`/`frequency`).
  - `resumeAlert` — also clears `paused_until` on manual resume (best-effort, ignored if the column doesn't exist).
  - New `snoozeAlertByToken(token)` — public, token-scoped variant for the unsubscribe-recovery box, mirroring `pauseAlertByToken`.
- `src/app/api/cron/alert-digest/route.ts` — before the existing due-alert fetch, auto-resume any `status='paused'` row whose `paused_until` has passed (`status: 'confirmed'`, `paused_until: null`); no-ops gracefully if the column isn't migrated yet.
- `src/components/AlertActions.tsx` — a "Snooze 30 days" button next to Pause on a confirmed alert.
- `src/app/alerts/manage/page.tsx` — read `paused_until` (graceful-degrade select, same pattern as the other optional columns) and show "Paused until <date>" instead of the bare "Paused" chip when a resume date is set and still in the future.
- `src/components/UnsubscribeRecover.tsx` — a third recovery action ("Snooze 30 days instead") next to Pause/weekly, via `snoozeAlertByToken`, with copy naming the real resume date.

## Acceptance criteria
- Clicking "Snooze 30 days" on `/alerts/manage` sets the alert to paused with a `paused_until` ~30 days out; the row's status chip reads "Paused until <real date>".
- The digest cron (`/api/cron/alert-digest`) never emails a snoozed alert while `paused_until` is in the future, and flips it back to `confirmed` (clearing `paused_until`) once that date has passed, verified against real logic (unit test or direct DB check), not just code inspection.
- Manually clicking "Resume" on a snoozed alert clears `paused_until` immediately (not just status).
- The unsubscribe-recovery box (`/alerts/status?state=unsubscribed`) offers "Snooze 30 days" alongside its existing pause/weekly options, and on success shows the real resume date, never vague copy.
- Everything degrades gracefully (no user-facing error, existing behavior preserved) if `alerts.paused_until` isn't migrated live yet — same pattern as `frequency`/`price_drop_opt_in`.
- `npx tsc --noEmit` and `npx next build` both pass; new unit tests for `alertSnooze.ts` pass.

## Out of scope
- A configurable snooze duration (fixed 30 days only, per the backlog item).
- Snoozing from the capture-time `AlertSignup` form (management/recovery surfaces only, per the backlog item).
- Applying the live migration against Supabase (flagged for human action, same as the other pending `alerts.*` columns).
