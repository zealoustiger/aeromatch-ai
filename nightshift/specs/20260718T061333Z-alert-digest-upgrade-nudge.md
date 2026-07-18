# Weekly→daily one-click upgrade nudge in high-volume digests

## Goal
When a weekly-cadence alert's digest is genuinely busy (≥5 total new-listing +
price-drop matches), show one honest line in the email offering a one-click
switch to daily digests — mirroring the existing one-click daily→weekly "fewer
emails" link, just in the other direction.

## Scope
- `src/lib/alertFrequency.ts`: add a pure `shouldOfferDailyUpgrade(frequency,
  totalMatches)` helper + a `DIGEST_UPGRADE_THRESHOLD` constant (5), unit
  tested in `alertFrequency.test.ts`.
- `src/app/api/alerts/frequency/route.ts`: generalize the existing
  weekly-only `applyWeeklyFrequency` into `applyFrequency(token, dir)`, read
  an optional `?dir=daily` query param (default stays `weekly` — every
  already-sent email link with no `dir` param keeps working byte-for-byte),
  redirect to `/alerts/status?state=<dir>`.
- `src/app/alerts/status/page.tsx`: add a `daily` state (icon/copy mirroring
  the existing `weekly` state) + its `resolveState`/manage-link branches.
- `src/lib/email.ts` `buildAlertDigestEmail`: add an optional `upgradeUrl`
  param rendered as one line above the footer (same visual treatment as the
  existing `marketPulse` line) — "Busy week for this search — switch to
  daily digests →". Omitted whenever not passed. HTML + text bodies both.
- `src/app/api/cron/alert-digest/route.ts`: in the single-alert send path
  only (the combined multi-alert-per-email path already deliberately omits
  `frequencyUrl` for the same "ambiguous across multiple alerts" reason —
  same precedent applies here), compute `upgradeUrl` via
  `shouldOfferDailyUpgrade` when `frequency === 'weekly'` and there's no
  `bestDrop` (the rich single-price-drop template stays out of scope, same
  as `frequencyUrl`'s existing scoping), pass it into
  `buildAlertDigestEmail`.

## Acceptance criteria
- `shouldOfferDailyUpgrade('weekly', 5)` → `true`; `('weekly', 4)` → `false`;
  `('daily', 10)` → `false` (a daily alert has no faster cadence to offer).
- `GET /api/alerts/frequency?token=X` (no `dir`) still sets `weekly` and
  redirects to `state=weekly` — unchanged from today.
- `GET /api/alerts/frequency?token=X&dir=daily` sets `frequency: 'daily'` on
  the row and redirects to `state=daily`.
- `/alerts/status?state=daily` renders an honest "you're on daily emails now"
  confirmation with a "Manage your alerts" link, mirroring the `weekly` state.
- A weekly digest email with ≥5 total matches renders the upgrade line
  linking to the token-scoped daily-upgrade URL; a weekly digest under the
  threshold, or any daily-cadence digest, renders no such line.
- `next build` + `tsc --noEmit` clean; QA smoke passes on `/`, `/aircraft`
  (this is a non-visual/backend + email-template change — no UI a normal
  visitor sees rendered differently, so screenshots aren't required, but
  `/alerts/status` is worth a quick manual check since it does render).

## Out of scope
- The combined (multiple-alerts-same-email) digest send path — same
  scoping precedent as the existing `frequencyUrl`.
- The rich single-listing price-drop template (`buildPriceDropEmail`).
- Any change to the actual cron send cadence/threshold logic beyond the new
  pure helper.
