# Spec: post-title-autofill

**UTC:** 2026-06-27T08:06:51Z  
**Slug:** post-title-autofill  
**Pillar:** Posting (Pillar 1)

## Goal
Make the Title field optional on aircraft-for-sale and partnership post forms by auto-generating it server-side from make + model (+ year for aircraft) when left blank. Removes the last "I have to think of something" required field so sellers can publish without writing copy.

## Scope
- `src/app/actions.ts` — `createAircraftListing`: if title blank, generate `"${year} ${make} ${model}"` (year omitted when absent).
- `src/app/actions.ts` — `createPartnershipListing` (around line 103): if title blank, generate `"${make} ${model} Partnership"`.
- `src/components/PostAircraftForm.tsx` — remove `required` from Title `<Input>`; update placeholder to show auto-fill hint.
- `src/components/PostPartnershipForm.tsx` — remove `required` from Title `<Input>`; update placeholder to show auto-fill hint.

## Acceptance criteria
1. Aircraft form: submitting with Title blank (but Make + Model filled) inserts a row with an auto-generated title like "2006 Cessna 182T" (or "Cessna 182T" when year absent). No server error.
2. Partnership form: submitting with Title blank (but Make + Model filled) inserts a row with title "Cessna 172S Partnership". No server error.
3. Aircraft form: Title field has no `required` attribute; a meaningful placeholder explains auto-fill.
4. Partnership form: Title field has no `required` attribute; a meaningful placeholder explains auto-fill.
5. If a title IS provided, the provided value wins — no clobbering.
6. `npx next build` exits 0, no TypeScript errors.
7. QA smoke exits 0 on `/aircraft/new` + `/partnerships/new` at 1280 + 375.

## Out of scope
- Seeking form (title is personal/freeform — "IFR pilot seeking…" — hard to auto-generate sensibly).
- Client-side live preview of the auto-generated title (pure server-side fallback is sufficient).
- Any DB schema changes.
