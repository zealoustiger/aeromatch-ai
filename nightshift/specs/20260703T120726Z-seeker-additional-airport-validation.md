# seeker-additional-airport-validation

## Goal
Reject a syntactically-valid-but-fake `additional_airport_2` code on the seeker
("pilot seeking partnership") post/edit form instead of silently storing it,
mirroring the server-side validation already applied to the primary `home_airport`
field.

## Background
The `airport-icao-server-validation` cycle (2026-07-03) made `createSeekerListing`,
`updateSeekerListing`, and the aircraft/partnership equivalents reject a `home_airport`
code that doesn't resolve against the real `airports` table (~17k rows), instead of
silently saving a listing with derived-null location. Its own "Next" note flagged
that the seeker form's *optional second* airport, `additional_airport_2`, still has
no such check — `createSeekerListing`/`updateSeekerListing` (`src/app/actions.ts`)
just `.trim().toUpperCase()` the raw input and store it directly in the
`additional_airports text[]` column with zero lookup. A typo'd second airport
silently: (1) renders as a bogus code on the listing detail page ("also: XXXX"), and
(2) never matches when another visitor searches/filters by that real airport — the
whole point of the field (`seekersQuery.ts` ORs `additional_airports` into the
airport-match filter). This is friction moved, not removed — the poster believes
they've listed a second real base airport and searchers relying on it get nothing.

## Scope
- `src/app/actions.ts`: `createSeekerListing` and `updateSeekerListing` — when
  `additional_airport_2` is non-empty, look it up against `airports` (same
  `.select('name, city, state').eq('icao', ...).maybeSingle()` shape used for
  `home_airport`) and throw the same style of clear inline error if it doesn't
  resolve. Leave it alone (no lookup, no throw) when the field is blank — it's
  optional. No `airport_name`/`city`/`state` are derived from this field today
  (it's stored as a bare code, unlike `home_airport`), so the fix is validate-only,
  not a new derivation.
- No schema change (the `additional_airports` column and its graceful-fallback
  retry-on-missing-column pattern are unchanged and untouched).

## Acceptance criteria
- Posting a new seeking listing with a real `additional_airport_2` code (e.g. KSQL)
  still succeeds exactly as before.
- Posting with `additional_airport_2` left blank still succeeds exactly as before
  (field stays optional, no lookup attempted).
- Posting with a well-formed but fake code (e.g. "ABCD") throws a clear inline error
  before any insert, instead of silently saving.
- Editing an existing seeking listing to set/clear/change `additional_airport_2`
  follows the same three rules as above.
- `npx tsc --noEmit` and `npx next build` both pass clean.
- QA smoke (`qa-smoke.mjs`) passes on `/partnerships/seeking/new` at desktop 1280 +
  mobile 375: HTTP 200, zero app-origin console errors, zero horizontal overflow.

## Out of scope
- Any change to `home_airport` validation (already correct).
- Any change to the aircraft or partnership forms.
- Deriving `airport_name`/`city`/`state` for the second airport (not used anywhere
  today — out of scope, would be a separate feature).
- The `additional_airports`-column-missing graceful fallback (unchanged).
