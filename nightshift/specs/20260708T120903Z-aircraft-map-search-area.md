# aircraft-map-search-area

## Goal
Port the already-shipped `/partnerships` "search this area" map filter (slice 3 of the
Map Search backlog item, shipped as `partnerships-map-search-area`) onto `/aircraft`, so
panning/zooming the aircraft map and clicking "Search this area" filters the results list
below to only the pins visible in the current viewport — closing the next open slice of
BACKLOG.md's `[P1][want] Map search (Zillow/Redfin core)` item.

## Scope
- `src/components/AircraftLeafletMap.tsx` — add the `MapController` (`useMap()` +
  `useMapEvents({moveend, zoomend})`) + `moved`/`map` state + floating "Search this area"
  button + `searchThisArea()` (`map.getBounds().contains([p.lat, p.lng])` over the existing
  pins) that calls `filterListByBounds(ids)` from `src/lib/mapListSync.ts` (already exists,
  shared with partnerships). Clear the filter (`filterListByBounds(null)`) on unmount, same
  as `PartnershipsLeafletMap.tsx`.
- New `src/components/AircraftResultCount.tsx` (client component, mirrors
  `PartnershipResultCount.tsx`): subscribes to `MAP_BOUNDS_FILTER_EVENT`; when filtered,
  renders "Showing M of N in this map area · Show all" (reset button calls
  `filterListByBounds(null)`); otherwise renders the **existing** pagination-aware text
  aircraft already has ("Showing X–Y of Z aircraft for sale" / "N+ aircraft for sale found")
  passed in as `children`/props — preserving today's exact copy when unfiltered.
- `src/components/AircraftSaleList.tsx` — swap the current inline `<p>` count line (around
  line 962-976) for `<AircraftResultCount>`, passing through the same `total`/`exact`/
  `rangeStart`/`rangeEnd`/`approx` values it already computes. No query/pagination logic
  changes.
- `src/components/AircraftSaleCard.tsx` — add the `hiddenByArea` state + `useEffect`
  subscribing to `MAP_BOUNDS_FILTER_EVENT` (`hiddenByArea = ids != null && !ids.includes(p.id)`)
  and apply a `hidden` class when true, mirroring `PartnershipCard.tsx`'s equivalent logic
  from the same partnerships slice. (Not in scope: `focusListingFromMap`/scroll-highlight —
  that's list↔map sync, the separate remaining slice for a future cycle.)

## Out of scope
- Map → list "↓ Show in list" popup button and list → map "Show on map" card button
  (list↔map sync — the other remaining Map Search slice for aircraft, next cycle).
- Any schema/query/JSON-LD change — this is purely a client-side view over listings already
  fetched, identical in kind to the partnerships slice.
- Changing aircraft pagination behavior itself (page size, `exact` count logic) — only how
  the existing count line renders when the map's bounds filter is active.

## Acceptance criteria
- On `/aircraft`, opening the map, panning/zooming, and clicking "Search this area" filters
  the results below to only aircraft whose resolved pin falls in the current viewport.
- The results-count line reads "Showing M of N in this map area · Show all" while filtered,
  and clicking "Show all" (or collapsing the map) restores the original pagination-aware text
  with no filter applied.
- Unfiltered behavior (map never opened, or opened but "Search this area" never clicked) is
  byte-identical to today's rendered count text and card list.
- `npx tsc --noEmit` and `npx next build` both clean.
- `qa-smoke` on `/aircraft` and `/aircraft?make=Cessna` at 1280 + 375: HTTP 200, zero
  app-origin console errors, zero horizontal overflow.
- Visual cycle — screenshots confirm the floating "Search this area" button and the filtered
  count line render correctly with no overlap/overflow at both viewports.
