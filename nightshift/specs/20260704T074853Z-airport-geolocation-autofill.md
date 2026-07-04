# Spec: Home-airport "Use my location" autofill

UTC: 20260704T074853Z
Slug: airport-geolocation-autofill

## Goal
Let a poster fill the Home Airport field with one tap (browser geolocation → nearest
airport) instead of having to know or type their airport's ICAO/IATA code or city name —
removes a real friction point on all three post forms (Pillar 1: frictionless posting).

## Scope
- `src/components/AirportFormInput.tsx` — the shared airport-autocomplete input used by
  `PostAircraftForm`, `PostPartnershipForm`, and `PostSeekerListingForm` (home airport +
  seeker's second airport). Add a "📍 Use my location" button inside the input that:
  1. Requests the browser's geolocation (`navigator.geolocation.getCurrentPosition`).
  2. Queries the existing `airports` table (already has `lat`/`lng` columns) with a
     lat/lng bounding box, computes haversine distance client-side, and picks the
     nearest non-closed/non-heliport airport.
  3. Fills the field via the existing `pick()` path (same as clicking a suggestion), so
     `useFormDraft` autosave and AI-prefill parity are unaffected.
  4. Shows inline, non-blocking states: "Locating…" while pending, and a small message on
     permission-denied / no-nearby-match / unsupported-browser — never a crash, always
     leaves manual typing available.
- No schema change (reuses existing `airports.lat`/`airports.lng`).
- No other component touches.

## Acceptance criteria
- A "📍 Use my location" button renders inside every `AirportFormInput` instance (aircraft
  home airport, partnership home airport, seeker home + second airport).
- Clicking it (with geolocation permission granted) fills the field with the nearest
  airport's ICAO code and the existing suggestion dropdown / manual typing still work
  exactly as before.
- Permission-denied or geolocation-unsupported shows a small inline message and does not
  throw a console error or break the form.
- No new required fields, no schema/migration needed.
- `npx next build` + typecheck pass; QA smoke (desktop 1280 + mobile 375) passes with zero
  new console errors and no horizontal overflow on `/aircraft/new`, `/partnerships/new`,
  `/partnerships/seeking/new`.

## Out of scope
- Adding this to the browse/filter airport inputs (separate component/backlog item).
- Server-side geocoding, IP-based location fallback, or PostGIS/earthdistance queries.
- Any change to the AI-draft extraction paths.
