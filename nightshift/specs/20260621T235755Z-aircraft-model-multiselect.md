# aircraft-model-multiselect

## Goal
On `/aircraft`, let a pilot filter by **multiple models of the selected make at once**
(e.g. Cirrus SR20 **and** SR22 together) instead of being limited to a single model —
the next slice of the [P1][want] "Marketplace filters: multi-select + ranges" item
(ranges shipped 2026-06-21; this is the Model multi-select slice).

## Scope (small, additive)
- `src/components/AircraftSaleFilters.tsx` — replace the single Model `<select>` with a
  compact, scrollable **checkbox group** of the selected make's models; toggling a model
  adds/removes it from the comma-joined `model` URL param. No make selected → unchanged
  "Select a make first" empty state.
- `src/components/AircraftSaleList.tsx` — in `fetchAircraftPage`, make the `model` filter
  accept a comma-joined list: 1 value → `.eq` (unchanged), 2+ → `.in('model', [...])`.
- `src/lib/seo.ts` — `describeAircraftFilters` renders a multi-model selection cleanly
  (e.g. "Cirrus SR20 / SR22") for the save-search / email-alert context.

No new component, color, dependency, route, schema, DB, or SQL. Mobile drawer reuses
`AircraftSaleFilters`, so the one component change covers desktop + 375px.

## Acceptance criteria
1. `npx next build` + `tsc --noEmit` green (only the pre-existing `.test.ts` baseline errors).
2. Selecting two models of a make (e.g. `?make=Cirrus&model=SR20,SR22`) returns listings of
   BOTH models and a count = (SR20 count + SR22 count), strictly more than either alone.
3. A single selected model behaves exactly as before (`.eq`, same count).
4. The checkboxes pre-populate from the URL on both the desktop sidebar and the mobile drawer;
   changing the make clears the model selection; "Clear all" clears models.
5. The save-search / alert text describes a multi-model search without a raw comma
   (e.g. "Cirrus SR20 / SR22 …"), no dropped clause.
6. QA smoke exit 0 (HTTP 200, zero app console/hydration errors, zero horizontal overflow)
   at desktop 1280 + mobile 375 on `/aircraft` and a multi-model URL; screenshots look right.

## Out of scope
- Listing-Quality multi-select (a later slice of the same item).
- Make multi-select, removable active-filter chips, any query change beyond `model`.
- The make+model SEO pages (they use `modelPattern`, not `model` — untouched).
