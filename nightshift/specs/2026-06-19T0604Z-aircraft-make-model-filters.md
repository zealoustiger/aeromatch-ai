# Spec — Make + Model dependent dropdowns on /aircraft

UTC: 2026-06-19T06:04Z · slug: `aircraft-make-model-filters` · branch: `night/aircraft-make-model-filters`

## Why this task (PM notes)
- CHANGELOG has no prior cycle / no failure to fix → pick top backlog item.
- BACKLOG **[P1] Filter UI overhaul** says: *"Lead with Make + Model (the primary
  search path — Model options depend on selected Make)."* This is the first, most
  valuable slice of that multi-cycle item.
- The other P1 (missing photos) overlaps live human work-in-progress in the working
  tree (uncommitted scraper adapters `hangar67.mjs`, `aircraftforsale.mjs`,
  `ingest-core.mjs`, `AircraftSaleCard.tsx`). Touching it risks colliding with the
  human's in-flight scraper changes, so it is deliberately skipped this cycle.
- Data check (live DB, status='active'): 1,856 listings, 123 makes, 648 models, every
  row has a make. Top makes are clean (Cessna 303, Cirrus 251, Piper 180, Beechcraft
  172, Mooney 101). Sorting the Make dropdown by listing count pushes scraper junk
  ("Hangar", "Land") to the bottom. Dependent dropdowns are viable.

## Goal
Replace the free-text **Make** input with a real **Make** dropdown (populated from live
listings, most-listed first) plus a dependent **Model** dropdown whose options follow the
selected Make — making Make + Model the lead, primary search path on `/aircraft`.

## Scope (files expected to touch)
- `src/lib/aircraft-facets.ts` (NEW) — server helper returning sorted makes + modelsByMake.
- `src/app/aircraft/page.tsx` — fetch facets, pass to filters (desktop + mobile drawer).
- `src/components/MobileFiltersDrawer.tsx` — thread an optional `facets` prop through.
- `src/components/AircraftSaleFilters.tsx` — Make select + dependent Model select, lead the panel.
- `src/components/AircraftSaleList.tsx` — apply the new `model` filter to the query.

## Acceptance criteria
1. `/aircraft` shows a **Make** `<select>` (not a text input) listing real makes from the
   DB, ordered most-listed first; choosing one updates the URL `?make=`.
2. A **Model** `<select>` appears whose options are exactly the models for the selected
   Make; it is disabled/empty until a Make is chosen. Selecting a model updates `?model=`.
3. Changing the Make resets the Model selection (no stale model from a different make).
4. The results list actually narrows by the chosen Make and Model (server query honors
   `?make=` and `?model=`).
5. Make + Model are the first two controls in both the desktop sidebar and the mobile
   filter drawer, and the panel is usable at 375px width.
6. `npx next build` passes (compile + typecheck); no new browser console errors on `/aircraft`.

## Out of scope
- The full Controller-style filter taxonomy (avionics / total time / SMOH / engine time)
  — those are later slices of the same backlog item.
- Any change to the scraper, ingest, photos, or `AircraftSaleCard` (avoid colliding with
  human WIP).
- No new DB schema; facets are derived at read time from existing columns.
- No restyle/rebrand; reuse existing sky-blue accent and current control styling.
