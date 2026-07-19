# alert-resend-bounced-heads-up

## Goal
Give the "Didn't get it? Resend confirmation email" flow in `AlertSignup` the same
honest bounced-address heads-up that the three original subscribe paths already got
(`alert-bounced-heads-up`, 2026-07-19), so resending to a known-dead address doesn't
silently look like a normal success.

## Scope
- `src/app/actions.ts` — `sendConfirmationResend` (the helper shared by
  `resendAlertConfirmation` and `resendAlertConfirmationByEmail`): add
  `bouncedHint: await hasBouncedBefore(alert.email)` to its `{ ok: true }` return.
- `src/components/AlertSignup.tsx` — `handleResend`: on a successful resend, call
  `setBouncedHint(!!result.bouncedHint)` so the existing amber "mail to this address
  has bounced before" line (already rendered in the pending-state success panel,
  driven by the same `bouncedHint` state the initial submit sets) reflects the
  freshest bounce status after a resend too.

## Acceptance criteria
- Resending a confirmation email for an address with a prior `status='bounced'` row
  shows the amber bounced heads-up line after the resend completes (not just on the
  original submit).
- Resending for a clean address shows no bounced hint, unchanged from today.
- `resendAlertConfirmation` (the owner-scoped `/alerts/manage` resend button, sharing
  `sendConfirmationResend`) keeps working unchanged — its caller doesn't read the new
  field, so this is a pure additive, backward-compatible return shape.
- No new capture point, no schema change, no new `alert_subscribed` event.
- `next build` + `tsc --noEmit` pass; QA smoke on `/alerts` (renders `AlertSignup`)
  clean at desktop 1280 + mobile 375, zero new console errors.

## Out of scope
- Wiring the same hint into `/alerts/manage`'s resend button UI (`AlertActions.tsx`)
  — that surface is signed-in/owner-scoped and already knows the alert is real; this
  slice stays scoped to the public double-opt-in resend chokepoint the prior cycle's
  "Next" note named.
- The dormant-subscriber re-permission email (the other open batch #9 item) — separate,
  larger slice (new schema column, cron logic) for a future cycle.
