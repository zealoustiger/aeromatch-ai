# airport-icao-validation

## Goal
Stop the shared `AirportFormInput` (used on all 3 post forms) from silently accepting
and submitting a non-ICAO string (e.g. a typed city name the user never resolved via
the suggestion dropdown) into a `home_airport` field, which today produces a required
field that "saves" but breaks the airport_name/city/state auto-fill and the SEO state
pages that key off it — friction moved (the user thinks they're done) instead of removed,
and a data-integrity regression under GOAL.md's posting-friction guardrail.

## Scope
- `src/components/AirportFormInput.tsx` only (shared by `PostPartnershipForm.tsx`,
  `PostSeekerListingForm.tsx` — `home_airport` (required) + `additional_airport_2`
  (optional) — and `PostAircraftForm.tsx` — `home_airport` (optional)).
- Add native HTML5 `pattern="[A-Za-z0-9]{4}"` (matches the codebase's own existing
  ICAO-format assumption, already used to suppress the dropdown query) so the browser
  blocks submission when the field's value isn't a 4-character code.
- Add a small inline styled error (suppress the native validation bubble via `onInvalid`
  + `preventDefault`, track `isInvalid` state) so the user gets a clear, on-brand message
  instead of a bare browser tooltip.
- No server action / schema changes — this is a client-side gate only.

## Acceptance criteria
- Typing a city name (e.g. "Austin") into a Home Airport field and clicking elsewhere/
  submitting without picking a dropdown suggestion shows an inline error ("Select an
  airport from the list, or enter its 4-letter code.") and blocks form submission.
- Clicking a suggestion (or arrow-keying + Enter) still fills the ICAO code and submits
  normally — no behavior change to the working path.
- Typing a raw valid-looking 4-character code (e.g. "KAUS") directly still submits fine
  (existing debounce-suppression behavior unchanged).
- Optional airport fields (`additional_airport_2`, aircraft form's `home_airport`) are
  unaffected when left blank — only validated if the user types something.
- `npx next build` + `tsc --noEmit` pass.
- QA smoke passes (HTTP 200 / no console errors / no horizontal overflow) on
  `/partnerships/new`, `/aircraft/new`, `/partnerships/seeking/new` at desktop + mobile.

## Out of scope
- Fuzzy/typo-tolerant ICAO matching server-side.
- Validating that a syntactically-valid 4-char code is a *real* airport in the DB
  (existing server-side null-fallback behavior for that edge case is unchanged).
- Any change to `actions.ts` or the `airports` table query.
