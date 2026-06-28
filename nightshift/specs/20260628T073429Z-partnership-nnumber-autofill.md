# Spec: partnership-nnumber-autofill

**Timestamp:** 20260628T073429Z  
**Pillar:** Posting (Pillar 1)  
**Friction removed:** Partnership owners currently type Make, Model, Year, and N-number as four separate fields. This cycle wires up N-number autofill on the partnership post form — same FAA-registry lookup already powering the aircraft sale form — so typing the tail number fills all three in one keystroke.

## Goal
Add N-number autofill to `/partnerships/new`: type the tail number → auto-fill Make (select), Model, and Year from the FAA registry. Mirrors the `nnumber-autofill` cycle for the aircraft post form.

## Scope (files to touch)
- `src/components/PostPartnershipForm.tsx` — move the N-number field from "More details" into "The basics" section (first field, above Make/Model), add `isLookingUp`/`lookupStatus` state, add `handleLookup` function calling `/api/faa-lookup`, wire blur auto-trigger + "Look up →" button, remove duplicate registration field from "More details"

No schema changes. `/api/faa-lookup` already exists and returns `{ found, make, model, year }` with make normalized to the MAKES dropdown values.

## Acceptance criteria
1. On `/partnerships/new`, the "The basics" section shows an N-Number field as the first field (above Make / Model / Home Airport / Share Type / Buy-In).
2. When a user types a valid N-number and tabs out (blur), the form auto-calls `/api/faa-lookup` and fills Make, Model, and opens "More details" to show the filled Year — all without clicking any button.
3. A "Look up →" button also triggers the same lookup manually; clicking it from the N-number field doesn't double-lookup.
4. On a successful lookup, a "Found: {year} {make} {model}" message appears in green below the field.
5. On a not-found result, "Not found — fill in manually" appears in muted text; the user can still fill fields manually.
6. The N-number field is removed from the "More details" → "Aircraft" subsection (no duplicate).
7. `npx next build` passes with zero TypeScript errors.
8. QA smoke passes: HTTP 200, no app-origin console errors, no horizontal overflow on `/partnerships/new` at desktop 1280 + mobile 375.

## Out of scope
- Any schema change
- Changing the aircraft sale form (already done)
- Multi-N-number or batch lookup
- Changing the seeking form
