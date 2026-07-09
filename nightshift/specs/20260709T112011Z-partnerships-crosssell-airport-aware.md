# partnerships-crosssell-airport-aware

## Goal
Make the `/partnerships` → aircraft-for-sale `MarketplaceCrossSell` card airport-aware, mirroring the airport-awareness `/aircraft`'s reverse-direction cross-sell already has (`aircraft-crosssell-airport-aware`, 2026-07-06).

## Scope
- `src/components/AircraftSaleList.tsx`: extend `countForSale(make?, opts?: { airport?: string })` to narrow by the airport's state (same airport→state resolution `fetchAircraftPage` already performs internally), mirroring `countActivePartnerships`'s `opts` pattern.
- `src/app/partnerships/page.tsx`: pass `nearAirport={params.airport}` into `<MarketplaceCrossSell>`, and thread `params.airport` into both the `countForSale(...)` and `fetchAircraftPage(...)` calls that feed it (`fetchAircraftPage` already accepts an `airport` filter — just wasn't being passed here).

## Acceptance criteria
- On `/partnerships?airport=KAUS` (or any valid ICAO with for-sale inventory in that state), the "Prefer to own outright?" cross-sell card copy reads "…near KAUS" and its count/sample rail reflect aircraft in that airport's state, not the nationwide total.
- On `/partnerships` with no airport filter, the card is unchanged (nationwide count/samples, no "near" copy) — no regression.
- `/partnerships?make=Cessna&airport=KAUS` combines both: count/samples narrowed by make AND airport-state.
- `npx next build` + typecheck pass.
- QA smoke (desktop 1280 + mobile 375) passes on `/partnerships`, `/partnerships?airport=KAUS`, `/partnerships?make=Cessna&airport=KAUS` — HTTP 200, no console errors, no horizontal overflow.
- No schema change, no new component, no new dependency.

## Out of scope
- True radius-based multi-airport matching for aircraft (partnerships' `countActivePartnerships` does haversine-radius airport lists; aircraft has no such helper — mirroring the *existing* airport→state narrowing `fetchAircraftPage` already uses for aircraft is the correct, consistent scope here, not inventing new radius logic).
- Any other cross-sell surface.
