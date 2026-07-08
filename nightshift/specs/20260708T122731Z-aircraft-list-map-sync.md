# aircraft-list-map-sync

## Goal
Port the `/partnerships` list↔map sync (both directions) onto `/aircraft`, closing the last
open slice of the `[P1][want]` "Map search (Zillow/Redfin core)" backlog item.

## Scope
- `src/components/AircraftLeafletMap.tsx` — accept `focusId`/`focusNonce` props (list → map),
  register marker refs + a cluster ref, and add a "↓ Show in list" button in each pin's popup
  that calls `focusListingFromMap(id)` (map → list). Mirrors `PartnershipsLeafletMap.tsx`.
- `src/components/AircraftMapView.tsx` — listen for `LIST_FOCUS_PIN_EVENT`, auto-open the map,
  scroll it into view, and hand the target pin id + a bump nonce down to the leaflet map.
  Mirrors `PartnershipsMapView.tsx`.
- `src/components/AircraftSaleCard.tsx` — add an `onMap` prop; when true, render a "Show on
  map" footer button (`focusPinFromList(p.id)`). Add the map→list highlight: listen for
  `MAP_FOCUS_LISTING_EVENT`, scroll the card into view + a 2s ring highlight when it matches.
  Mirrors `PartnershipCard.tsx`.
- `src/components/AircraftSaleList.tsx` — accept a `mapPinIds?: Set<string>` prop, thread
  `onMap={mapPinIds?.has(p.id) ?? false}` into each `AircraftSaleCard`. Mirrors
  `PartnershipList.tsx`.
- `src/app/aircraft/page.tsx` — compute `mapPinIds` from the already-built `aircraftMapPins`
  and pass to `AircraftSaleList`.

No schema/query change — reuses the existing generic `src/lib/mapListSync.ts` event pattern
(`MAP_FOCUS_LISTING_EVENT`, `LIST_FOCUS_PIN_EVENT`) already shared with partnerships.

## Acceptance criteria
- On `/aircraft`, opening the map and clicking a pin's popup "↓ Show in list" scrolls to and
  briefly highlights the matching card below.
- Clicking a card's "Show on map" (only rendered when that listing has a resolvable pin) opens
  the map if collapsed, scrolls it into view, and pans/zooms to (spiderfying out of a cluster
  if needed) + opens the popup for the correct pin.
- `npx tsc --noEmit` and `npx next build` both clean.
- `qa-smoke` passes on `/aircraft` (desktop 1280 + mobile 375): HTTP 200, zero app-console
  errors, zero horizontal overflow.
- No visual regression to the base `/aircraft` page or the existing "search this area" feature.

## Out of scope
- Any change to `/partnerships` (already fully shipped).
- Geocoding accuracy improvements (city-level matching is a known, accepted limitation).
