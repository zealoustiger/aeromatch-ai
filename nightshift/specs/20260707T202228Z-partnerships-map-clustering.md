# partnerships-map-clustering

## Goal
Cluster overlapping/nearby pins on the `/partnerships` map so listings sharing (or
near) an airport are actually visible and clickable, instead of silently stacking.

## Why (data-verified, not hypothetical)
Live-DB check (service-role, read-only) of active `partnerships`: 23 rows across
only 9 unique `home_airport` values — **KPAO alone has 10 active listings**, KSQL 3,
KLVK/KOAK/KHWD 2 each. Since `PartnershipsLeafletMap` (shipped last cycle,
`partnerships-map-view`) places one `<Marker>` per listing at its airport's exact
lat/lng, most of those markers render exactly on top of each other — only the
last-drawn one is visible/clickable per airport. This is a real, present bug in the
just-shipped map, not cosmetic polish, and is backlog item "Map search (Zillow/
Redfin core)" slice 2 (pin clustering) — `[P1][want]`, BACKLOG.md line 949.

## Scope
- Add `react-leaflet-cluster` (4.1.3 — declares peer support for react-leaflet
  ^5.0.0 / react ^19 / leaflet ^1.9, matching this repo's installed versions
  exactly) as a new dependency.
- `src/components/PartnershipsLeafletMap.tsx`: wrap the existing `<Marker>` list in
  `<MarkerClusterGroup>` so co-located/nearby pins group into a numbered cluster
  bubble that expands (spiderfies or zooms) on click; single pins render exactly as
  today (same icon, same popup content, same "View listing →" link).
- Import `leaflet.markercluster`'s default CSS alongside the existing
  `leaflet/dist/leaflet.css` import (same client-only component, no new SSR surface).
- `PartnershipsMapView.tsx` / the `/partnerships` page: no change — pins prop shape
  is unchanged, this is purely internal to the map component.

## Out of scope
- The `/aircraft` map (blocked separately on geocoding `aircraft_for_sale.location`).
- "Search this area" region filter (slice 3) and list↔map sidebar sync (slice 4).
- Any change to how pins are queried/resolved server-side.

## Acceptance criteria
- `npx next build` + typecheck clean.
- `/partnerships` smoke-tests clean (HTTP 200, zero app-console errors, zero
  horizontal overflow) at 1280 + 375 with the map opened.
- Opening the map, the 10 KPAO listings render as ONE cluster bubble labeled "10"
  (not 10 stacked/invisible markers); clicking it zooms/spiderfies to reveal
  individual markers.
- A single-listing airport (e.g. one of the non-duplicated ones) still renders as a
  normal individual marker with the same popup content as before (make/model,
  airport/city/state, buy-in, "View listing →" link to `/partnerships/[id]`).
- No visual regression to the collapsed/closed state of the map toggle.
