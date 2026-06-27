# Spec: post-airport-autocomplete

**UTC:** 2026-06-27T07:29:38Z  
**Pillar:** 1 — Frictionless listing posting  
**Slug:** post-airport-autocomplete

## Goal
Remove the friction of needing to know a 4-letter ICAO code to post a partnership or seeker listing. Users can type a city name, airport name, or IATA/ICAO code and pick from instant suggestions; the selected ICAO auto-fills the field.

## Scope
- **New file:** `src/components/AirportFormInput.tsx` — uncontrolled form-compatible airport autocomplete (same Supabase query + ranking logic as the existing `AirportAutocompleteInput`, but renders a named `<input>` that works with `useFormDraft` and `fillFormField`)
- `src/components/PostPartnershipForm.tsx` — replace plain ICAO `Input` in the Home Airport section with `AirportFormInput`
- `src/components/PostSeekerListingForm.tsx` — replace plain ICAO `Input` in the Base Location section with `AirportFormInput`

## Acceptance criteria
1. On `/partnerships/new`, typing "Austin" in the Home Airport field shows at least one suggestion including "KAUS"; clicking it sets the field to "KAUS".
2. On `/partnerships/seeking/new`, typing "Austin" in the Home Airport field shows at least one suggestion including "KAUS"; clicking it sets the field to "KAUS".
3. Typing a 4-letter ICAO directly (e.g. "KPAO") in either field: the value is stored correctly; no suggestion popup disrupts the experience.
4. AI prefill ("Prefill from your notes ✨") fills `home_airport` correctly; no unwanted suggestions pop up after prefill.
5. Draft autosave/restore (`useFormDraft`) preserves the home airport field across page reloads.
6. Suggestions dropdown does not cause horizontal overflow at 375px mobile viewport.
7. `npx next build` exits 0 with no TypeScript errors; QA smoke exits 0 on both affected paths.

## Out of scope
- Multiple base airports (a separate future slice)
- Applying autocomplete to the browse/filter airport inputs (already done via `AirportAutocompleteInput`)
- Airport autocomplete on the aircraft post form (no ICAO field there)
- Validation that the typed value is a known ICAO (form still accepts freeform text as a graceful fallback)
