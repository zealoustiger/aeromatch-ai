# digest-monthly-fewer-emails

## Goal
Extend the digest/price-drop email footer's "Get fewer emails" one-click link so a
weekly-cadence subscriber can drop to monthly (today it's daily-only, dead-ending at
"unsubscribe" for weekly subscribers), and stop the plain-text footer from always
naming "weekly" as the target cadence.

## Scope
- `src/app/api/alerts/frequency/route.ts` — widen the `dir` param to accept
  `monthly` (currently only `daily` or default `weekly`); redirect state includes
  `monthly`.
- `src/app/alerts/status/page.tsx` — add a `monthly` status-page state (icon/title/
  body + "Manage your alerts" link), mirroring the existing `weekly`/`daily` states.
- `src/lib/email.ts` — `buildAlertDigestEmail` and `buildPriceDropEmail` gain an
  optional `frequencyTarget?: 'weekly' | 'monthly'` (default `'weekly'`, so every
  existing call/test stays byte-exact) used only to fix the text-part's hardcoded
  "(switch to weekly)" label.
- `src/app/api/cron/alert-digest/route.ts` — compute `frequencyUrl` for BOTH daily
  (→ weekly, today's behavior, byte-exact) AND weekly (→ monthly, new) cadence
  alerts; monthly alerts still get no link (nothing lower to switch to). Pass the
  matching `frequencyTarget`.
- Unit tests in `src/lib/email.test.ts` and `src/lib/alertFrequency.test.ts` for the
  new cases.

## Acceptance criteria
- A weekly-cadence alert's digest/price-drop email footer now includes a "Get fewer
  emails" link pointing at `/api/alerts/frequency?token=...&dir=monthly`, with text-
  part label "(switch to monthly)".
- A daily-cadence alert's footer link/label is completely unchanged (still
  `dir` omitted → defaults to `weekly`, label "(switch to weekly)").
- A monthly-cadence alert's footer still has no "Get fewer emails" link (nothing
  lower to switch to).
- Visiting `/api/alerts/frequency?token=<real token>&dir=monthly` sets that alert's
  `frequency` to `monthly` and redirects to `/alerts/status?state=monthly&token=...`,
  which renders an honest "You're on monthly emails now" confirmation with a working
  "Manage your alerts" link.
- `npx next build` + `tsc --noEmit` pass; existing email/alertFrequency unit tests
  still pass; new cases added and passing.
- No schema change, no new capture point, no FREEZE file touched.

## Out of scope
- The success-panel "cap at max price" refine, the watched-listing-unavailable
  cross-sell, the confirm-resend bounce-hint parity, and the dormant-subscriber
  re-permission email — separate items in the same plan-pass batch, not this slice.
- `buildAlertDigestEmail`'s "this week" body-copy wording (separate batch item).
