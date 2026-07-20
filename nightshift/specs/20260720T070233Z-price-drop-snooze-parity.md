# price-drop-snooze-parity

## Goal
Add the "Snooze 30 days" footer link to `buildPriceDropEmail` (the rich single-listing
price-drop template), matching the snooze link already offered by every other subscriber
email (`buildAlertDigestEmail`, `buildCombinedAlertDigestEmail`).

## Scope
- `src/lib/email.ts` — `buildPriceDropEmail`: add optional `snoozeUrl?: string` param,
  render it as a fourth quiet footer link (after Unsubscribe / Get-fewer-emails) in both
  the HTML and text bodies, mirroring the exact pattern already used in
  `buildAlertDigestEmailCore`/`buildCombinedAlertDigestEmailCore`.
- `src/app/api/cron/alert-digest/route.ts` — the `bestDrop` → `buildPriceDropEmail(...)`
  call site (~line 2025) already computes `snoozeUrl` (used a few lines below by the
  sibling `buildAlertDigestEmail` call) but never passes it into `buildPriceDropEmail`.
  Add `snoozeUrl,` to that call.
- `src/lib/email.test.ts` — new unit tests: presence/absence of the snooze link, and
  (mirroring the digest tests) both frequencyUrl + snoozeUrl rendering together.

## Acceptance criteria
- `buildPriceDropEmail({ ...BASE, snoozeUrl: '...' })` renders a "Snooze 30 days" link in
  both `html` and `text`, using the same `/api/alerts/snooze?token=...` URL shape as the
  sibling digest builders.
- Without `snoozeUrl`, no "Snooze 30 days" text appears anywhere in `html` or `text`
  (no regression for every existing call site/test).
- The cron's `bestDrop` price-drop send path now passes the already-computed `snoozeUrl`
  through to `buildPriceDropEmail`.
- `npx next build` + `tsc --noEmit` stay clean; full unit test suite passes including the
  new cases.
- No schema change, no new capture point — pure email-builder + one cron call-site change.

## Out of scope
- Any other footer-link parity gap (already-shipped links stay as-is).
- The other three `[P2][goal]` items in this backlog batch (admin re-permission block,
  confirm-email deliverability copy, capture-funnel self-check) — separate slices.
- Actually invoking the live cron route against prod data (this is a pure function/
  builder change with no rendered page markup).
