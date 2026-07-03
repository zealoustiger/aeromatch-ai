# Spec: airport-icao-server-validation

## Goal
Reject a submitted Home Airport code that doesn't resolve to a real airport, instead of silently saving the listing with null airport_name/city/state — closing the server-side half of the gap the client-side `airport-icao-validation` cycle (2026-07-03) flagged as still open.

## Context
The prior cycle added client-side format validation (must look like a 4-letter code) to `AirportFormInput`, but a syntactically-valid, non-existent code (e.g. "ABCD") still passes that check, reaches the server, and the `airports` table lookup returns no row — today every create/update action just sets `airport_name`/`city`/`state` (or `location`/`state` for aircraft) to null and inserts anyway. The listing goes live silently missing its derived location everywhere the site shows it (SEO state pages, browse cards, detail page). Confirmed live: the `airports` table has 16,885 rows (the full public airport dataset, down to small private strips), so a real user's home base will almost always resolve — a non-match is overwhelmingly a typo or fake input, not a legitimate gap in our data.

## Scope
- `src/app/actions.ts`: `createPartnership`, `updatePartnershipListing`, `createSeekerListing`, `updateSeekerListing` (home_airport is required on these three) and `createAircraftListing`, `updateAircraftListing` (home_airport is optional — only validate when non-empty).
- For each, after the existing `airports` table lookup, throw a clear `Error` when the code doesn't resolve, instead of proceeding with nulls.
- Reuse the existing inline-error mechanism: all three post forms already wrap their action call in `useActionState` with a try/catch that turns a thrown `Error`'s message into `state.error`, rendered in an existing red inline box above the submit button (`PostPartnershipForm.tsx:738`, `PostAircraftForm.tsx:570`, `PostSeekerListingForm.tsx:785`). No new client-side error UI needed.

## Out of scope
- The seeker form's optional second airport (`additional_airport_2`) — lower-value, not the primary field.
- Any change to `AirportFormInput`'s client-side (format-only) validation — that's already correct for what it checks.
- A DB backfill/cleanup of existing listings that already have a null-derived location from a bad code.

## Acceptance criteria
- Submitting any of the 3 post forms (or the 2 edit forms with a re-supplied airport) with a well-formed-but-unresolvable 4-character code shows a clear inline error and does NOT create/update the row.
- Submitting with a real, resolvable code (picked from suggestions or typed directly) still works exactly as before — no new friction for the common path.
- Aircraft form: leaving Based-at blank still publishes with no location, as before (still optional).
- `npx tsc --noEmit` and `npx next build` pass clean.
