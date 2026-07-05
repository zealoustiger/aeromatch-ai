## Goal
Catch a typo'd/nonexistent airport ICAO code inline on the post forms — before submit — instead of only discovering it after a full round-trip to the server.

## Scope
- `src/components/AirportFormInput.tsx` (shared by `PostAircraftForm`, `PostPartnershipForm`, `PostSeekerListingForm`, and all 3 edit forms) — the `query()` function currently suppresses ANY lookup once the typed value matches the complete 4-char ICAO pattern (`/^[A-Z0-9]{4}$/i`), to avoid dropdown noise. Extend that branch: instead of doing nothing, run a debounced exact-match lookup (`.eq('icao', code.toUpperCase())`) against the `airports` table. If no row exists, set the existing `isInvalid` state (already wired to a red border + inline "Select an airport from the list, or enter its 4-letter code" message) — same UI the current HTML5-`pattern` mismatch path already uses. If the lookup errors (network), do nothing (avoid a false-positive red border).
- No other files. No new components, no schema change, no new query patterns (mirrors the existing `.eq('icao', ...)` pattern already used server-side in `src/lib/airports.ts` and in `src/app/actions.ts`'s validation).

## Acceptance criteria
- Typing a complete-format code that does not exist in the `airports` table (e.g. `ZZZZ`) shows the red-border invalid state + inline message within ~1s of finishing typing, without submitting the form.
- Typing a real ICAO code (e.g. `KAUS`) directly (not picked from the dropdown) does NOT show the invalid state.
- Picking a suggestion from the dropdown still works exactly as before (no invalid flash).
- Partial/in-progress typing (< 4 chars, or non-ICAO-format queries) is unaffected — no new invalid state fires while a user is still mid-fuzzy-search.
- A Supabase fetch error during the exact-match check does not falsely mark the field invalid.
- `npx next build` passes with no new type errors.

## Out of scope
- Server-side validation in `src/app/actions.ts` (already correct, unchanged).
- Duplicate-N-number checks, or any other post-form friction candidate.
- Adding a positive "✓ valid airport" affordance — only fixing the false-negative gap (silence on a bad code), not adding new confirmation UI.
