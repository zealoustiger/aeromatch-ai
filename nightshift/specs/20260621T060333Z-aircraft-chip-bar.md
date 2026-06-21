# Spec — Etsy × Airbnb visual refresh, slice 3: category chip bar on /aircraft

## Goal
Add one tasteful, horizontally-scrolling row of small icon "chips" at the top of
`/aircraft` that set existing filter URL params (make, price band, mission) — an
Airbnb-style quick-filter strip that makes the page feel like a consumer
marketplace, reusing the slice-1 design tokens for cohesion.

## Scope (small, additive)
- **New** `src/components/AircraftChipBar.tsx` — a presentational chip strip. Each
  chip is a Next `<Link>` that toggles a single existing query param on `/aircraft`
  (preserving other active params). Active chip = highlighted; clicking an active
  chip clears it.
- **Edit** `src/app/aircraft/page.tsx` — render `<AircraftChipBar>` just under the
  page header, above the filters/listings row. Pass it the live `facets` (for the
  top makes) and the current `params` (for active state).
- No `globals.css` change (reuse existing `.ch-*` tokens + Tailwind). No backend,
  no schema, no new dependency.

## Chip groups (all map to EXISTING params used by AircraftSaleList)
- **Make** (up to 5 top makes from `facets.makes`) → `?make=<make>`
- **Price band** → `?max_price=` : "Under $100k" (100000), "Under $250k" (250000),
  "Under $500k" (500000)
- **Mission** (keyword search) → `?q=` : "IFR", "Glass cockpit", "Tailwheel",
  "Low time"
- "Near me" is intentionally **out of scope** this cycle (needs geolocation =
  heavier + riskier; the task says "and/or"). Make + price + mission give the full
  Airbnb-strip feel with zero geolocation.

## Acceptance criteria (QA grades against these)
1. A horizontally-scrolling chip row renders at the top of `/aircraft` (above the
   filters/listings), styled cohesively with the cream surface / `.ch-*` tokens.
2. Clicking a chip navigates to `/aircraft?<param>=<value>` (preserving any other
   active params) and the listings update; clicking an active chip clears that param.
3. The active chip is visually highlighted to match the live URL params.
4. On 375px the chip row scrolls horizontally and does NOT cause page horizontal
   overflow (`scrollWidth - clientWidth === 0` on `<html>`/`<body>`).
5. `npx next build` + `tsc --noEmit` pass (no new errors vs the pre-existing
   `.test.ts` baseline).
6. No new console errors / hydration warnings at desktop 1280 + 375px; the existing
   filters, save heart, compare, badges, pagination all still work.

## Out of scope
- No geolocation / "near me", no nav or IA restructure, no new page/route.
- No change to the filter sidebar, the listing card, or the query logic.
- No `globals.css` token edits, no schema/DB/SQL, no new dependency.
- Not touching `/partnerships` this cycle (chip bar there is a future slice).
