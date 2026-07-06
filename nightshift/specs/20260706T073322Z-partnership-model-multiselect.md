# partnership-model-multiselect

## Goal
Give the `/partnerships` browse filter a Model checkbox multi-select backed by
live facets (parity with `/aircraft`'s Make→Model UX), closing the parity gap
flagged in a prior cycle's CHANGELOG note ("the partnerships/seeking Model
filter is currently a free-text input, not the checkbox multi-select /aircraft
has ... needs the multi-select UI first").

## Scope
- New `getPartnershipFacets()` in `src/lib/partnershipsQuery.ts` (mirrors
  `src/lib/aircraft-facets.ts`, mock-mode aware like the rest of this file):
  returns `{ makes: string[], modelsByMake: Record<string,string[]> }` from
  live/mock active `partnerships` rows.
- `src/app/partnerships/page.tsx`: fetch facets, pass to both
  `PartnershipFilters` call sites (sidebar + `MobileFiltersDrawer`).
- `src/components/PartnershipFilters.tsx`: Make becomes a `<select>` populated
  from facets (falls back to today's free-text input when facets are empty,
  matching `AircraftSaleFilters`' fallback pattern); Model becomes a checkbox
  multi-select scoped to the selected make, `model` URL param becomes a
  comma-joined list.
- `src/components/MobileFiltersDrawer.tsx`: thread a `facets` prop through to
  the `partnership` variant (mirrors the existing `aircraft` variant's prop).
- `src/lib/partnershipsQuery.ts` filter application (`getPartnershipListings`
  + the mock-mode filter path): `model` parses a comma list → `.eq` for one
  value, `.in()` for multiple (same pattern as `AircraftSaleList.tsx`).
- `src/components/PartnershipActiveFilterChips.tsx`: render one removable chip
  per selected model (mirrors the existing multi-`airports` chip pattern)
  instead of today's single combined chip.
- No schema change. No FREEZE files touched.

## Acceptance criteria
1. `/partnerships` Make renders as a dropdown of live distinct makes (ranked
   by listing count); falls back to a free-text input if facets are empty.
2. Selecting a make reveals a Model checkbox list of that make's live distinct
   models; selecting 2+ models ORs them via `.in('model', [...])`; the `model`
   URL param is comma-joined and shareable/bookmarkable.
3. Selecting exactly one model still works via `.eq` (existing single-value
   links/saved searches with `?model=X` keep filtering correctly).
4. Active-filter chips show one removable chip per selected model; removing
   one chip keeps the others (not a full reset).
5. Mobile filter drawer shows the same Make/Model UI with no 375px overflow.
6. `npx next build` + `npx tsc --noEmit` clean; QA smoke passes on
   `/partnerships` (desktop 1280 + mobile 375, zero console errors, zero
   overflow).

## Out of scope
- The seeker (`/partnerships/seeking`) Model filter — same free-text gap,
  explicitly flagged as its own next slice, not attempted this cycle.
- Variant-group rollup (`groupModelVariants`, "SR20 (all)") on the new
  partnership model list — plain checkboxes only this slice.
- Normalizing stored variant casing in the DB (deferred, human call per an
  earlier backlog note).
