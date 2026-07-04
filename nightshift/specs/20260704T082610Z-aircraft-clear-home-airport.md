# aircraft-clear-home-airport

## Goal
Let a seller editing an aircraft-for-sale listing actually remove a previously-set "Based at" location — today, leaving the field blank on edit is silently a no-op instead of clearing it.

## Scope
- `src/app/actions.ts` — `updateAircraftListing`: read a new `clear_home_airport` form field; when the airport input is blank AND this flag is set, set `locationUpdate = { location: null, state: null }` instead of leaving the stored value untouched.
- `src/components/PostAircraftForm.tsx` — in edit mode, when `initialValues?.currentLocationLabel` exists, render a small "Remove this listing's location" checkbox next to the "Based at" field. When checked, submit a hidden `clear_home_airport=true` field and (via JS) treat the visible airport input as intentionally blank.

## Acceptance criteria
- On `/aircraft/listing/[id]/edit` for a listing with an existing location, a "Remove location" checkbox is visible (create mode: not shown, since there's nothing to clear yet).
- Checking it and submitting (with the airport field left blank) clears `location`/`state` to `null` in the DB.
- Leaving the checkbox unchecked and submitting with a blank airport field still preserves the existing stored location (no regression to current behavior).
- Typing a new airport into the field still overwrites location/state as before (checkbox is irrelevant/ignored in that case).
- `next build` + typecheck pass; QA smoke passes on `/aircraft/new`, `/post`, and a real `/aircraft/listing/[id]/edit`.

## Out of scope
- Storing the raw ICAO so the field can be prefilled with the original input (bigger, schema-touching alternative — not needed for this slice).
- Any change to the partnership/seeker forms (their `home_airport` field is required, so no "clear" case applies).
