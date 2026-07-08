# Spec — partnerships-map-search-area

## Goal
Add a Zillow/Redfin-style **"Search this area"** control to the `/partnerships` map so a
visitor can pan/zoom the map and filter the list below to only the listings visible in the
current map viewport (Map search backlog item, slice 3 — "search this area" / region filter).

## Scope (small, client-side only — no schema/query change)
- `src/lib/mapListSync.ts` — add a second window-CustomEvent (`MAP_BOUNDS_FILTER_EVENT` +
  `filterListByBounds(ids | null)`) alongside the existing focus event.
- `src/components/PartnershipsLeafletMap.tsx` — track map move/zoom; show a floating
  "Search this area" button after the map is moved; on click compute `map.getBounds()`,
  filter the in-memory `pins` to those inside, dispatch the event with their ids.
- `src/components/PartnershipCard.tsx` — listen for the bounds event; hide (`hidden`) any
  card not in the visible-id set; show all again when cleared (`ids === null`).
- New `src/components/PartnershipResultCount.tsx` — client component that owns the
  "N partnerships found" line so the count stays honest under filtering ("Showing M of N
  in this map area · Show all"); wired into `PartnershipList.tsx`'s `renderList`.
- `src/components/PartnershipsMapView.tsx` — clear the bounds filter when the map is
  collapsed/unmounted so the list never stays silently filtered with no visible map.

## Acceptance criteria
- Opening the map and dragging it reveals a "Search this area" button; clicking it filters
  the list to only listings whose pins are within the current viewport.
- The results-count line updates to "Showing M of N in this map area" with a working
  "Show all" reset that restores the full list.
- Collapsing the map ("Hide map") clears the filter (full list restored).
- No fabricated data: filtering is purely a client-side view over listings already on the
  page; JSON-LD / SEO / server queries are unchanged.
- `npx next build` + typecheck clean; qa-smoke on `/partnerships` at 1280 + 375 exits 0
  (HTTP 200, zero app-console errors, zero horizontal overflow).

## Out of scope
- The `/aircraft` map half (still blocked on geocoding `aircraft_for_sale.location`).
- Server-side/URL-persisted bounds filtering (this slice is an in-page view filter only).
- Any change to the map's default collapsed state, clustering, or existing list↔map sync.
