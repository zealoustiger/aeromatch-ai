# Unsubscribe recovery: offer "fewer," literally

## Goal
The one-click unsubscribe recovery box on `/alerts/status` only offers "pause"
(all-or-nothing). Add a token-scoped "Switch to weekly instead" option for
daily-frequency alerts, plus a "Manage all your alerts" link — so the recovery
surface actually offers "fewer" (GOAL.md), not just "pause or nothing."

## Scope
- `src/app/actions.ts` — new public, token-scoped `updateAlertFrequencyByToken(token)`
  server action (mirrors `pauseAlertByToken`): revives the alert to
  `status: 'confirmed', frequency: 'weekly'`; gracefully degrades (retries with
  just `status: 'confirmed'`) if the `frequency` column isn't migrated live yet,
  same precedent as every other `alerts.frequency`/`price_drop_opt_in` write path.
- `src/app/alerts/status/page.tsx` — for the `unsubscribed` state, look up the
  alert's current `frequency` by `unsubscribe_token` (admin client, same
  graceful-degrade-on-missing-column pattern `/alerts/manage` already uses) and
  pass it + the token down to `UnsubscribeRecover`.
- `src/components/UnsubscribeRecover.tsx` — when the alert's frequency is
  `'daily'`, render a second "Switch to weekly instead" button alongside the
  existing "Pause instead" one, calling `updateAlertFrequencyByToken`. Add a
  "Manage all your alerts" link (`/alerts/manage?token=<token>`) below both
  buttons. Emit `alert_unsubscribe_recovered` with `{ action: 'paused' | 'weekly' }`.

## Acceptance criteria
- On `/alerts/status?state=unsubscribed&token=...` for an alert whose frequency
  is `daily`, the recovery box shows both "Pause instead" and "Switch to weekly
  instead" buttons plus a "Manage all your alerts" link.
- For a `weekly`-frequency (or unknown/not-yet-migrated) alert, only "Pause
  instead" + the manage link show — no redundant "switch to weekly" for an
  alert that's already weekly.
- Clicking "Switch to weekly instead" flips the alert to `status='confirmed',
  frequency='weekly'` (verified against a real throwaway `@example.com` test
  alert, deleted after) and shows an inline confirmation — no page reload.
- `alert_unsubscribe_recovered` fires with `action: 'weekly'` on that path and
  `action: 'paused'` on the existing pause path (payload shape verified, not
  guessed).
- `npx tsc --noEmit` and `npx next build` both exit 0.
- QA smoke passes on `/alerts/status` at desktop 1280 + mobile 375 (HTTP 200,
  zero app-console errors, zero horizontal overflow).

## Out of scope
- Any change to the pause/delete/resume flows on `/alerts/manage` itself.
- A "switch to daily" reverse direction (not requested; the goal is offering
  *fewer*, not more).
- Applying the pending `alerts.frequency` DDL migration live (human action,
  already tracked elsewhere).
