# Distance line on digest cards for airport-scoped alerts

## Goal
Show "~35 nm from KHWD" on a digest listing card when the subscriber's alert
targets exactly one unambiguous airport, so the one fact they filtered on
(distance from their field) is actually visible in the email.

## Scope
- `src/lib/email.ts`: add optional `distanceNm`/`fromIcao` to
  `AlertDigestSample`; render a "~N nm from ICAO" segment in both the HTML
  `specsLine()` and the plain-text specs builder.
- `src/lib/airports.ts`: export `haversineNm` (was module-private).
- `src/app/api/cron/alert-digest/route.ts`: new `resolveRowDistances` +
  `distanceFor` helpers; wire into `fetchNewPartnershipSamples`,
  `fetchPartnershipPriceDropSamples`, and `fetchNewSeekerSamples` — computed
  from `target.icao` (partnership) or `target.icaos[0]` when exactly one code
  (seeker) to each sample row's own `home_airport`.
- `src/app/api/dev/email-preview/alert-digest/route.ts`: add a
  `distanceNm`/`fromIcao` fixture value to one preview sample for visual QA.

## Acceptance criteria
- A partnership/seeker alert scoped to exactly one airport (`?airport=KHWD` or
  a single-code `?airports=KHWD`, with or without `&radius=`) renders
  "~N nm from KHWD" after the location in both the HTML card and the
  plain-text fallback, for both new-listing and price-drop samples.
- A multi-airport seeker alert (`?airports=KHWD,KPAO`), an alert with no
  airport filter at all, or a row whose `home_airport` doesn't resolve a real
  coordinate in the `airports` table, never shows a distance line (no
  estimated/guessed number) — the specs line renders exactly as before.
- Aircraft-alert samples are unaffected (no ICAO radius helper exists for
  them; out of scope, matching the existing `resolveAircraftAirportState`
  precedent).
- `npx tsc --noEmit` and `npx next build` both clean.
- Existing `email.test.ts` digest suite still passes; new cases cover the
  positive distance-line render and the negative (omitted) cases.

## Out of scope
- Aircraft-alert distance lines (no lat/lng radius helper for aircraft today).
- Exposing `distanceNm` anywhere on-site (this is an email-only slice).
- Wiring distance into `resolvePartnershipWatch`/single-listing watch digests
  (those aren't a filtered search — no "my searched field" to measure from).
