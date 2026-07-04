# aircraft-avionics-field

## Goal
Let a self-posted (organic) aircraft-for-sale listing populate `avionics`, so the
already-built Avionics/IFR-suitability analysis (`AvionicsPanel`, `computeIfrSuitability`
in `src/lib/avionicsClassify.ts`) can render on it — today it's structurally impossible,
since no post form or AI-draft path ever writes to `aircraft_for_sale.avionics` (only the
scraped-ingest pipeline does).

## Scope
- `src/components/PostAircraftForm.tsx` — add an optional "Avionics & equipment" free-text
  input (comma-separated, e.g. "G1000, GFC 500 autopilot, ADS-B Out") in the "Aircraft specs"
  block of "More details", right after Engine. Include it in the AI-draft auto-fill
  (`handleGenerate`) and the "More details auto-open" check. Add `avionics?: string[]` to
  `AircraftEditInitial`, defaulting the input to the joined comma string.
- `src/app/actions.ts` — `createAircraftListing`/`updateAircraftListing`: parse the new
  `avionics` form field (split on comma, trim, filter empty → `string[] | null`). Add
  `avionics?: string[]` to `AircraftDraft`, extend `draftAircraftFromText`'s system prompt +
  tool schema to extract an `avionics` string array only when equipment is explicitly
  mentioned (never invent).
- `src/app/aircraft/listing/[id]/edit/page.tsx` — select `avionics` and pass it through to
  `initialValues`.
- No schema change — `aircraft_for_sale.avionics` (`string[] | null`) already exists natively
  (used today by the scraped-ingest pipeline; `src/lib/types.ts:75`).

## Acceptance criteria
1. `/aircraft/new` → "More details" → "Aircraft specs" shows a new optional "Avionics &
   equipment" text input; submitting a comma-separated list persists to the `avionics` column
   as a string array.
2. `/aircraft/listing/[id]/edit` pre-fills the existing avionics list (joined with ", ") and
   can update it.
3. "Prefill from your notes ✨" (both paste-text and paste-URL paths) extracts avionics items
   from the input when explicitly mentioned (e.g. "G1000, GFC 500, ADS-B Out") and auto-fills
   the field; omits it when the input says nothing about equipment (never fabricates).
4. A self-posted listing with avionics filled in now renders `AvionicsPanel` and the IFR
   suitability block on `/aircraft/listing/[id]` (previously impossible for any organic post).
5. `npx tsc --noEmit` and `npx next build` both exit 0.
6. QA smoke (`qa-smoke.mjs`) passes on `/aircraft/new`, `/post`, and a real
   `/aircraft/listing/[id]`/edit route at desktop 1280 + mobile 375 — HTTP 200, zero
   app-origin console errors, zero horizontal overflow.

## Out of scope
- Backfilling `avionics` on existing organic listings that predate this field.
- Changing the ingest pipeline's own avionics extraction.
- A structured/checkbox avionics taxonomy (kept free-text to match the existing
  `classifyAvionics` pattern-matching approach, which already handles free-text items).
