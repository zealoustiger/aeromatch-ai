# Avionics filter on /aircraft browse

## Tier
`[want]` — human-authored "Planes for Sale: Filter UI overhaul" backlog item
(`nightshift/BACKLOG.md` ~line 1204): "Lead with Make + Model... Then secondary
filters: avionics, total time (tach/Hobbs), engine time (SMOH), year, price,
state." Total time/year/price/state already shipped; avionics was the one
dimension with zero UI, confirmed via a fresh code audit (no `avionics` string
anywhere in `AircraftSaleFilters.tsx`).

## Goal
Add an avionics-capability filter (Glass panel / ADS-B Out / Autopilot / WAAS
GPS / GPS navigator) to the `/aircraft` browse page, reusing the existing
`classifyAvionics` categorization already used on the listing detail page —
no new classification logic, no fabricated data.

## Scope
- `src/lib/avionicsClassify.ts`: export `AVIONICS_FILTER_OPTIONS` (key+label
  list) as the single source of truth for the filter UI.
- `src/components/AircraftSaleList.tsx`: new `avionics?: string` filter
  (comma-joined category keys, OR semantics — matches ANY selected capability,
  consistent with every other checkbox-group filter in this file like
  `model`/`grade`). Since `avionics` is a `text[]` column and PostgREST doesn't
  support `ilike` against arrays (confirmed live: `operator does not exist:
  text[] ~~* unknown`, and the `column::text` cast trick PostgREST supports for
  scalar columns does NOT coerce the array to a matchable string either — same
  error), do the category match in JS: fetch `id, avionics` for all active
  listings (paginated via the existing `fetchAllRows` helper — same technique
  already used for the family price/comp maps in this file), run
  `classifyAvionics` per row, then narrow the real query with
  `.in('id', matchingIds)` before `.range()`. Correct pagination/count, no new
  DB objects. Distance-sort (`aircraft_by_distance` RPC) + avionics together
  falls through to the plain query path (out of scope this slice — documented
  limitation, no crash).
- `src/components/AircraftSaleFilters.tsx`: new always-visible "Avionics"
  checkbox group (mirrors the Total Time promoted-out-of-"More filters"
  pattern), shared by desktop sidebar + `MobileFiltersDrawer` (which already
  renders this same component, no separate mobile file to touch).
- `src/components/ActiveFilterChips.tsx`: one removable chip per selected
  avionics category.
- `src/app/aircraft/page.tsx`: add `'avionics'` to the smart-search `STRUCTURED`
  keys list so a keyword search doesn't silently redirect-and-drop an active
  avionics filter.

## Acceptance criteria
- `/aircraft?avionics=glass` returns only listings `classifyAvionics` detects a
  glass-panel capability for; verified against live DB counts before/after.
- Checking 2 categories is OR (matches listings with either), matching the
  existing Model/Grade checkbox-group convention.
- Chip removal and "Clear all filters" both work for the new filter.
- Filter renders identically in the desktop sidebar and the mobile drawer
  (same shared component).
- `npx next build` + typecheck green; QA smoke passes desktop 1280 + mobile
  375 on `/aircraft` and `/aircraft?avionics=glass`; screenshots look correct
  (visual cycle — new UI).

## Out of scope
- Distance-sort + avionics combo (falls back to default sort, documented).
- Avionics filter on any other page (partnerships has no avionics data).
- A DB schema/generated-column change (JS-side classification is the existing
  precedent used elsewhere in this file; no migration needed, ships live
  tonight instead of self-suppressing pending a human DDL step).
