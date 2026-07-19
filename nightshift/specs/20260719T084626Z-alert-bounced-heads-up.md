# alert-bounced-heads-up

## Goal
When someone subscribes to an alert with an email address that has previously hard-bounced,
tell them so in the success panel instead of showing a fake "check your inbox" success that
will silently never arrive.

## Scope
- `src/lib/alertBounce.ts` — new `hasBouncedBefore(email)` service-role read: does this
  normalized email have any `alerts` row with `status='bounced'`?
- `src/app/actions.ts` — `subscribeToAlerts` and `subscribeSignedInAlert` both return a new
  `bouncedHint: boolean` alongside the existing `overlapContext`, computed after the
  insert/revive logic runs (so a row that was itself just revived out of `bounced` doesn't
  count against itself, but any *other* still-bounced row for the same email still does).
- `src/components/AlertSignup.tsx` — new `bouncedHint` state (same lifecycle as the existing
  `overlapContext` state); renders an amber "Heads up — mail to this address has bounced
  before. Double-check the spelling, or try a different address." line in both success
  panels (`submitted && confirmedImmediately` and plain `submitted`) when true.
- No schema/migration change — `status='bounced'` is an already-live, already-written value
  (`pauseAlertsForBouncedEmail` in `alertBounce.ts`), just never read back at capture time.

## Acceptance criteria
- Subscribing with an email that has zero `bounced` rows: unchanged behavior, no hint shown.
- Subscribing (fresh insert, revive-from-unsubscribed, revive-from-bounced, or 23505 no-op)
  with an email that has an existing `status='bounced'` row for a *different* source_path:
  the success panel shows the amber heads-up line.
- The subscription itself still succeeds normally (this is purely an honest UI hint, never a
  blocker) — no change to whether the row is inserted/revived or the confirmation email sent.
- Same hint wired into the signed-in one-click path (`subscribeSignedInAlert` /
  `handleSignedInSubmit`), not just the anon email-form path.
- `npx tsc --noEmit` and `npx next build` both pass.
- QA smoke (desktop 1280 + mobile 375, zero console errors, zero overflow) passes on at least
  one page rendering `AlertSignup` (e.g. `/alerts`).

## Out of scope
- Any UI/copy about *why* an address bounced (transient vs. permanent) — the existing revive
  flow already handles re-verification via a fresh double-opt-in.
- Enumeration protection changes — this only surfaces the hint to whoever just typed that
  exact address into the form, same trust boundary as the existing overlap hint.
- The `/alerts/manage`-by-email flow's own bounced-state display (already exists, untouched).
