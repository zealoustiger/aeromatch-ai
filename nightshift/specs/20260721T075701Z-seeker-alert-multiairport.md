# seeker-alert-multiairport

## Goal
Make a "pilot seeking a partnership" alert honor the same multi-airport (`airports=A,B,C`)
filter the `/partnerships/seeking` browse page itself supports, instead of silently
dropping it to a strictly broader "any airport" alert.

## Scope
- `src/app/partnerships/seeking/page.tsx` — `alertSourcePath` forwards the active
  `airports` CSV (falling back to the legacy single `airport`, + `radius` only when
  exactly one code is active), instead of only the legacy single `airport` param.
- `src/app/api/cron/alert-digest/route.ts` — seeker `AlertTarget` gains `icaos?: string[]`
  (replacing the single `icao`) + `radius?: number`; `parseSourcePath`, `countNewSeekers`,
  and `fetchNewSeekerSamples` resolve it via a new `resolveSeekerIcaoList` helper
  (radius-expand only when exactly one code, mirroring `seekersQuery.ts`'s
  `resolveSeekerAirports`) and query `home_airport.in.(...)` OR `additional_airports.ov.{...}`
  instead of a single `.eq`.
- `src/lib/alertMatchCounts.ts` — same treatment for its own local `AlertTarget`
  duplicate, `parseSourcePath`, `countActiveSeekers`, `previewSeekers`, and
  `countMatchingSeekerSubscribers`'s per-alert icaoList resolution.
- `src/lib/alertSubscriberMatch.ts` — `SeekerSubscriberTarget` gains `icaos?: string[]` +
  `radius?: number`; `parseSeekerAlertSourcePath` parses the CSV; `matchesSeekerListing`
  takes an optional caller-resolved `icaoList` param (mirrors `matchesPartnershipListing`).
- `src/lib/alertEditCriteria.ts` — preserve a multi-airport criterion losslessly through
  an unrelated edit (never silently drop/widen it because the single "Home airport" field
  can't display it); nicer hidden-criterion label for 2+ airports; a single-code
  `airports=` value stays editable via the existing Airport field exactly like `airport=`.

## Acceptance criteria
- Filtering `/partnerships/seeking` to 2+ airports and subscribing produces a
  `source_path` carrying `airports=A,B,C` (not silently narrowed to one or widened to none).
- The digest cron / live match-count / new-seeker-since-subscribe queries for such an
  alert match a listing whose `home_airport` OR `additional_airports` hits ANY of the
  alert's airports — verified via unit tests mirroring the existing single-icao cases.
- A single-airport alert (legacy `airport=` or modern one-code `airports=`) behaves
  identically to today (radius still applies), and remains editable on `/alerts/manage`.
- A 2+-airport alert survives an unrelated field edit (e.g. changing Make) on
  `/alerts/manage` without losing or widening its airport criterion — shows as a
  removable "near A, B" hidden-criteria chip instead.
- `npx tsc --noEmit` and `npx next build` stay clean; full unit-test suite passes with
  new/updated cases for the multi-airport paths.

## Out of scope
- Exposing multi-airport as an inline-editable field (chips) in the Edit/Duplicate form —
  stays a hidden, removable criterion this cycle (Duplicate loses it, same pre-existing
  limitation every other hidden/unexposed criterion already has for every alert type).
- Any change to the seeking browse page's own filter UI/query (`seekersQuery.ts`) —
  already supports multi-airport; this cycle only makes the *alert* honor it.
