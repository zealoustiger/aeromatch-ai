# Spec: aircraft-post-airport-autocomplete

**Timestamp:** 20260627T075014Z  
**Pillar:** Posting (Pillar 1) — rotating from last cycle's Pillar 3 (partnership-market-check)

## Goal
Replace the free-text "Location" + "State" pair on `/aircraft/new` with a single `AirportFormInput` airport autocomplete — the same component already shipping on the partnership and seeker post forms — so sellers type their airport in plain English (city, IATA, or ICAO) instead of filling two separate text boxes.

## Scope
2 files changed:
- `src/components/PostAircraftForm.tsx` — replace the "Price & Location" section's Location+State inputs with `AirportFormInput name="home_airport"` (optional); update `handleGenerate` to fill `home_airport` from the AI-extracted airport instead of `location`/`state`
- `src/app/actions.ts` — update `createAircraftListing` to read `home_airport` from formData and look up the airports table → derive `location` ("City, ST") and `state` ("ST"); same pattern as `createPartnershipListing`/`createSeekerListing`. Update `generateAircraftDraft` Zod/tool schema and `AircraftDraft` interface to return `home_airport` (ICAO) instead of `location`/`state`.

## Acceptance criteria
1. `/aircraft/new` renders a single "Based at (optional)" field using `AirportFormInput` — no separate Location or State text inputs
2. Typing a city, IATA, or partial ICAO shows airport suggestions; selecting one sets the field to the ICAO code
3. On form submit, the server action looks up the selected ICAO in the `airports` table and stores `location = "City, ST"` and `state = "ST"` — or null when the field is left blank
4. AI "Prefill from your notes" extracts a `home_airport` ICAO from pasted text and fills the autocomplete input (existing `fillFormField` dispatch pattern)
5. Build clean, smoke exit 0 at desktop 1280 + mobile 375 on `/aircraft/new` and `/aircraft`
6. Quality score `state` column still populated correctly when an airport is selected

## Out of scope
- Any other form or page
- Storing `home_airport` as a new DB column (location+state are derived server-side, no schema change)
- Making the field required
