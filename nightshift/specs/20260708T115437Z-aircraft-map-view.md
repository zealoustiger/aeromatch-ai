# aircraft-map-view

## Goal
Add the "aircraft" half of the Zillow/Redfin-style map search to `/aircraft` — the
last remaining blocked piece of the `[P1][want]` "Map search" backlog item, whose
`/partnerships` half is already fully shipped (view, clustering, search-this-area,
list↔map sync).

## Why aircraft was blocked, and how this unblocks it
Partnerships resolve a pin's coordinates via an exact `home_airport` ICAO → the
seeded `airports` table (`resolveAirportCoords`). `aircraft_for_sale` has no ICAO
column — only free-text `location` (usually "City, ST") + a `state` code. Verified
live against the DB (read-only): of 1,839 active, priced (`>=$50k`) listings with a
`location` set, matching `location`'s city + `state` against `airports.city`/`state`
(case-insensitive, preferring the largest airport type on collision) resolves
**63.8%** to a real seeded airport's coordinates. The rest (non-US locations, bare
state/typo'd/truncated city strings) simply get no pin — same "never fabricate,
self-suppress on no match" pattern `resolveAirportCoords` already uses for
unmatched ICAOs.

This is knowingly a coarser approximation than partnerships' exact-ICAO pins (a
city-level match, not the exact home field), so popups only ever show the
listing's own real `location`/`state` text — never a claim about a specific
airport the aircraft sits at.

## Scope
- `src/lib/airports.ts`: new `resolveLocationCoords()` — batched, per-state query
  against `airports` (only fetches states actually present among the passed
  locations, not the whole table), returns a `city|state` → `{lat,lng}` map,
  preferring `large_airport` > `medium_airport` > `small_airport` > `heliport` on a
  city-name collision. No new query for every distinct call — table already
  indexed on `icao` primary key; state-scoped `.in('state', ...)` keeps rows
  fetched small.
- New `src/components/AircraftMapView.tsx` (client) — collapsed-by-default
  "View on map (N)" toggle + dynamic (`ssr:false`) import, mirrors
  `PartnershipsMapView.tsx` exactly (own `MapPin` type: id, make, model, location,
  state, asking_price, lat, lng).
- New `src/components/AircraftLeafletMap.tsx` (client) — Leaflet map wrapped in
  `MarkerClusterGroup` (already an installed dependency, used by the partnerships
  map) from the start, since city-level matching means more listings will collide
  on the same coordinate than partnerships' airport-level matching did — shipping
  without clustering would repeat the exact stacked-pins bug partnerships hit and
  had to fix in a follow-up cycle. Popup: make/model, real location/state text,
  asking price, "View listing →" link to `/aircraft/listing/[id]`.
- `src/app/aircraft/page.tsx`: build `mapPins` from the already-fetched
  `itemListListings` (no second query) by parsing `location`'s leading city +
  `state`, calling `resolveLocationCoords`, dropping any listing that doesn't
  resolve; render `<AircraftMapView pins={mapPins} />` above the
  `<AircraftSaleList>` Suspense boundary (same position as partnerships' map).

## Out of scope (explicitly deferred, matching how partnerships shipped this in slices)
- "Search this area" viewport filter and map↔list sync (partnerships slices 3–4) —
  a natural next slice once this base view is live.
- Any geocoding/ICAO backfill on `aircraft_for_sale` itself (schema change) — this
  slice works entirely from data that already exists.
- Touching the partnerships map code at all.

## Acceptance criteria
- `/aircraft` (no filters) shows a "View on map (N)" toggle above the listings
  when at least one visible listing resolves to a real airport coordinate;
  renders nothing when zero resolve (self-suppress, no empty map).
- Opening it renders a Leaflet map with one clustered pin group per coordinate;
  clicking a cluster spiderfies to individual pins.
- A pin's popup shows real make/model/asking-price/location text (no fabricated
  airport claim) and a working link to that listing's detail page.
- No new dependency, no schema/DB change, no change to `/partnerships`.
- `npx tsc --noEmit` and `npx next build` both clean.
- `qa-smoke` on `/aircraft` (and one filtered variant, e.g. `?make=Cessna`) at
  desktop 1280 + mobile 375: HTTP 200, zero app-console errors, zero horizontal
  overflow.

## Out of scope
Anything listed above under "Out of scope"; no `[bug]`/`[want]` beyond this item.
