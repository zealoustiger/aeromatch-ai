# Spec: "Found my aircraft 🎉" exit on the unsubscribe-recovery page

## Goal
Give a subscriber who unsubscribes because they already found their aircraft a
one-tap way to say so — turning an indistinguishable-from-churn exit into an
honest success signal, with one non-pushy cross-sell (post it as a share).

## Scope
- `supabase/schema.sql` — additive `alerts.unsubscribe_reason text` column
  (nullable, no default, human must apply against live Supabase; every write
  path degrades gracefully if not yet applied).
- `src/app/actions.ts` — new public, token-scoped `markAlertFoundAircraftByToken(token)`
  server action, mirroring `pauseAlertByToken`'s trust boundary + missing-column
  fallback pattern. Does NOT touch `status` (already `unsubscribed` by the time
  this page renders) — just records the reason.
- `src/components/UnsubscribeRecover.tsx` — add a 4th action `'found'`:
  a "Found my aircraft 🎉" button, calling the new action, firing a new
  `alert_found_aircraft` PostHog event (distinct from `alert_unsubscribe_recovered`
  since nothing is being recovered), and a done-state message with one honest
  cross-sell link ("Flying it with partners? Post a share →" → `/partnerships/new`).

## Acceptance criteria
- On `/alerts/status?state=unsubscribed&token=...`, the recovery box shows a 4th
  button "Found my aircraft 🎉" alongside pause/snooze/(weekly).
- Clicking it calls `markAlertFoundAircraftByToken`, shows a congratulatory
  done-state ("🎉 Congrats on the new aircraft!") with a single link to
  `/partnerships/new`, and does not throw if the `unsubscribe_reason` column
  isn't migrated live yet (fails soft, same `{ok:true}` outcome).
- `alert_found_aircraft` fires exactly once, client-side, on success.
- No change to the existing pause/snooze/weekly buttons' behavior or copy.
- `npx next build` + `tsc --noEmit` pass.
- QA smoke passes on `/alerts/status` at desktop 1280 + mobile 375, zero console
  errors, zero overflow.

## Out of scope
- Any change to `status`, the digest cron, or the ownership/token model.
- Backfilling `unsubscribe_reason` for past unsubscribes.
- A reason for *other* unsubscribe motivations (too spammy / not relevant) —
  future follow-up, not this slice.
