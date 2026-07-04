# aircraft-annual-damage-form

## Goal
Add "Annual due" + "Damage history" fields to the aircraft-for-sale post/edit form so
self-posted aircraft listings can populate the `annual_due`/`damage_history` columns that
`aircraft_for_sale` already has and that the detail page's `AnnualStatusPanel`/
`DamageHistoryPanel` already render (currently only ingested/scraped listings ever get
these two columns populated, since only the ingest pipeline's description extraction
writes them).

## Scope
- `src/components/PostAircraftForm.tsx` — add a `Select` helper (mirroring
  `PostPartnershipForm.tsx`'s), an "Annual due" month `<input type="month">`, and a
  "Damage history" `<select>` (Prefer not to say / No damage reported / Damage reported)
  in the "Aircraft specs" block of "More details", plus `annual_due`/`damage_history` to
  the `AircraftEditInitial` interface and the edit-mode `open` heuristic.
- `src/app/actions.ts` — `createAircraftListing` and `updateAircraftListing`: parse and
  persist `annual_due` (append `-01` to the `YYYY-MM` input) and `damage_history`
  (`'true'`/`'false'` string → boolean/null) directly into the existing payload object.
  No fallback/optional-group machinery needed — unlike the partnership columns, these
  already exist natively on `aircraft_for_sale` (`supabase/schema.sql:108-109`).

## Out of scope
- AI-draft ("Prefill from your notes ✨") extraction of these two fields for aircraft —
  natural next slice, same as the partnership rollout (which shipped the form fields one
  cycle, then AI-draft extraction the next).
- Any change to the aircraft detail page, `getAircraftForSaleById`, or the panels
  themselves — they already render unconditionally when the columns are non-null.
- Any DB migration — the columns already exist.

## Acceptance criteria
- `/aircraft/new` shows "Annual due" (month picker) and "Damage history" (select) inputs
  in the Aircraft specs section of "More details", matching the partnership form's style.
- `/aircraft/listing/[id]/edit` shows the same fields, prefilled from the listing's current
  `annual_due`/`damage_history` values.
- Submitting either form persists `annual_due`/`damage_history` to `aircraft_for_sale` and,
  when set, the aircraft detail page then renders `AnnualStatusPanel`/`DamageHistoryPanel`.
- `npx next build` compiles clean (no TypeScript errors).
- QA smoke passes on `/aircraft/new` and `/post` at desktop 1280 + mobile 375 (HTTP 200,
  zero app-origin console errors, zero horizontal overflow).
