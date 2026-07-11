# Post-confirmation cross-sell on /alerts/status

## Goal
When a visitor confirms an aircraft-for-sale or partnership alert, offer one honest,
one-click suggestion to also alert on the counterpart listing type for the same make —
so a buyer who just confirmed "Cessna 172" alerts also gets offered "Cessna
co-ownership partnerships," and vice versa.

## Scope
- `src/app/api/alerts/confirm/route.ts` — forward the `confirm_token` on the
  `?state=confirmed` redirect (mirrors the existing unsubscribe-route convention of
  forwarding `unsubscribe_token` on `?state=unsubscribed`).
- `src/lib/alertCrossSell.ts` (new) — pure helper: parse a modern query-string
  `source_path` (`/aircraft?make=...`, `/partnerships?make=...`) into a counterpart
  suggestion `{ context, sourcePath, noun, label }`. Returns `null` when the source
  path isn't the modern make-carrying shape (legacy path-segment alerts, no-make
  alerts, seeker alerts) — no suggestion is shown rather than a weak/wrong one.
- `src/app/actions.ts` — new `subscribeToConfirmedAlert(originalToken, context,
  sourcePath)` server action: looks up the original alert by `confirm_token`, requires
  `status === 'confirmed'` (proves the email already cleared double opt-in), then
  inserts a new `alerts` row for that same email directly as `status: 'confirmed'`
  (no second confirmation email — the address is already verified). Idempotent on
  unique violation, same pattern as `subscribeToAlerts`.
- `src/components/AlertCrossSell.tsx` (new) — small client component: "Also want
  alerts for {suggestion}?" + a one-click "Yes, alert me" button, dismissible, fires
  `alert_subscribed` with `source: 'cross_sell'` on success.
- `src/app/alerts/status/page.tsx` — on `state=confirmed` with a token, admin-lookup
  the alert's `source_path`, compute the suggestion, render `AlertCrossSell` when one
  exists.

## Acceptance criteria
- Confirming an aircraft alert with a `make` (e.g. `/aircraft?make=Cessna`) shows a
  "Also want alerts for Cessna co-ownership partnerships?" prompt on `/alerts/status`.
- Confirming a partnership alert with a `make` shows the inverse aircraft-for-sale
  prompt.
- Clicking the one-click button creates a second, already-`confirmed` alert row for
  the same email (no new confirmation email) and fires `alert_subscribed` with
  `source: 'cross_sell'`.
- Confirming an alert with no `make` (bare `/aircraft`, `/partnerships`), a
  legacy path-segment alert, or a seeker alert shows no suggestion — never a
  fabricated/mismatched one.
- Unsubscribed/invalid status states are unaffected (no cross-sell prompt there).
- `next build` + typecheck green; QA smoke on `/alerts/status` (desktop + mobile)
  clean.

## Out of scope
- "Nearby state" or "sibling model" suggestion types (noted as a follow-up slice).
- Cross-sell suggestions for seeker alerts.
- Any change to the digest/email content itself.
