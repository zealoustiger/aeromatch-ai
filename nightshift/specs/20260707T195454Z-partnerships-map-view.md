# partnerships-map-view

## Tier
`[P1][want]` — "Map search (Zillow/Redfin core)" (BACKLOG.md, "Zillow/Redfin features buyers
love" section). Highest-priority open `[want]` item (the other open P1 `[want]`, "Redesign the
collection layout," is blocked awaiting a human mock — not actionable tonight).

## Goal
Ship slice 1 of "Map search" scoped to `/partnerships`: a collapsible map showing pins for the
currently-filtered partnership results, click a pin → mini-card → link to the listing.

## Why scoped to partnerships only (not `/aircraft` too)
`aircraft_for_sale` has no ICAO/lat/lng column (just free-text `location`/`state`) — plotting it
on a map needs a geocoding pass first (already flagged as a separate, unbuilt backlog item:
"geocoding `aircraft_for_sale.location`"). `partnerships` already stores a real `home_airport`
ICAO that joins cleanly to the `airports` table's seeded FAA lat/lng — no fabrication, no new
migration. Building the aircraft-side map is the natural next slice once geocoding lands.

## Scope
- `npm install leaflet react-leaflet @types/leaflet` (OpenStreetMap tiles — free, no API key,
  no billing surface — satisfies GOAL.md's "no paid network" guardrail).
- `src/lib/airports.ts`: add `resolveAirportCoords(icaos: string[])` — batched lookup of
  `{icao: {lat,lng}}` from the existing `airports` table (mirrors the existing
  `getAirportsWithinRadius` query pattern).
- `src/app/partnerships/page.tsx`: resolve coords for the already-fetched `itemListListings`
  (no duplicate query — this array is already fetched for the ItemList JSON-LD) into a `pins`
  array; drop listings whose ICAO doesn't resolve (no fabricated coordinates).
- New `src/components/PartnershipsMapView.tsx` (client): collapsed-by-default "View on map (N)"
  toggle above the results list; only renders when ≥1 pin resolves.
- New `src/components/PartnershipsLeafletMap.tsx` (client, lazy-loaded via `next/dynamic`
  `{ ssr: false }` only when the map is opened — keeps the Leaflet bundle off the default page
  load / CWV): `react-leaflet` `MapContainer` + `TileLayer` (OSM) + one `Marker`/`Popup` per pin
  (make/model, airport, buy-in, "View listing →" link to `/partnerships/[id]`).

## Acceptance criteria
- `/partnerships` renders a "View on map (N)" toggle when the active filters return ≥1
  partnership with a resolvable airport; toggle is collapsed by default (no layout shift, no
  extra JS loaded until clicked).
- Clicking it lazy-loads a Leaflet map with one pin per listing at its home airport's real
  FAA-seeded lat/lng (no invented coordinates).
- Clicking a pin opens a popup with make/model, airport/city/state, buy-in price (if set), and a
  working link to that listing's detail page.
- A filtered view with 0 results, or where no listing's ICAO resolves in `airports`, renders no
  map toggle (no empty/broken map).
- `npx next build` + typecheck clean; qa-smoke passes (200, no console errors, no horizontal
  overflow) on `/partnerships` at 1280 + 375 with the map both closed and opened.
- No schema change, no new paid service, `/aircraft` untouched.

## Out of scope
- `/aircraft` map (blocked on geocoding `aircraft_for_sale.location` — separate backlog slice).
- Pin clustering, "search this area," sidebar list↔map sync (later slices per BACKLOG.md).
- Any change to `/partnerships/near`, `/partnerships/state`, `/partnerships/make` sub-pages.
