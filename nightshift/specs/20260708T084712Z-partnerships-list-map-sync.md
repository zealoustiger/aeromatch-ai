# partnerships-list-map-sync

## Goal
Add the reverse direction of the `/partnerships` map ↔ list sync: clicking "Show on
map" on a listing card opens the map (if collapsed) and pans/zooms to that listing's
pin, opening its popup — completing slice 4 of the "Map search" `[P1][want]` backlog
item (map→list direction shipped 2026-07-08 via `partnerships-map-list-sync`).

## Scope
- `src/lib/mapListSync.ts` — new `LIST_FOCUS_PIN_EVENT` / `focusPinFromList()` (done).
- `src/components/PartnershipsMapView.tsx` — listen for the event, auto-open the map,
  scroll it into view, forward a focus id/nonce to the leaflet map.
- `src/components/PartnershipsLeafletMap.tsx` — accept a focus id/nonce prop; hold
  marker refs + the cluster-group ref; on focus, call `zoomToShowLayer` (handles both
  clustered and unclustered markers) then open that marker's popup.
- `src/components/PartnershipCard.tsx` — new optional `onMap?: boolean` prop; when
  true, render a small "📍 Show on map" button in the footer that calls
  `focusPinFromList(p.id)`.
- `src/components/PartnershipList.tsx` — new optional `mapPinIds?: Set<string>` prop,
  threaded to each card as `onMap={mapPinIds?.has(p.id)}`.
- `src/app/partnerships/page.tsx` — build `mapPinIds` from the already-computed
  `mapPins` array, pass to `<PartnershipList>`.

## Acceptance criteria
- On `/partnerships`, a card whose listing has a resolvable map pin shows a
  "Show on map" affordance; cards with no resolvable airport coords don't.
- Clicking it while the map is collapsed opens the map, scrolls it into view, and
  pans/zooms to the correct pin, opening its popup (spiderfies out of a cluster if
  needed).
- Clicking it while the map is already open re-pans/opens the popup without
  re-toggling the collapse state.
- No change to any other page that renders `PartnershipCard` (prop defaults to off).
- `npx next build` + typecheck clean; QA smoke passes on `/partnerships` at 1280 +
  375 with zero console errors / horizontal overflow; the interaction itself (open →
  click "Show on map" → pin popup visible) verified with a real Playwright click since
  qa-smoke's assertions don't exercise map interaction.

## Out of scope
- "Search this area" region filter (remaining map-search slice).
- The `/aircraft` half of map search (still blocked on geocoding
  `aircraft_for_sale.location`).
