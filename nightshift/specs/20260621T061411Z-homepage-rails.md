# Homepage curated rails (Etsy-style) — slice 4 of the Etsy × Airbnb visual refresh

## Goal
Add one or more horizontally-scrolling "collection" rails of REAL for-sale aircraft listings to the homepage (`/`), each titled and linking to the matching filtered `/aircraft?...` search page, to add browsable consumer-marketplace depth and spread internal-link/crawl reachability while STAGE=INDEXING.

## Scope (small, additive)
- New server component `src/components/HomeRails.tsx` — fetches REAL listings per rail via the marketplace's own `fetchAircraftPage()` helper (`src/components/AircraftSaleList.tsx`), drops any rail with too few listings, renders each rail as a horizontally-scrolling row.
- New presentational rail card `src/components/AircraftRailCard.tsx` — compact photo-forward card reusing the slice-1 `.ch-card` token + `getPlaceholderPhoto` + `formatPrice`; links to the listing's `source_url` (same target as `AircraftSaleCard`).
- One wiring edit to `src/app/page.tsx` — render `<HomeRails />` below the existing `<FeaturedListings />` newest-partnerships section (additive; nothing else touched).

## Rails (all use EXISTING `/aircraft` filter params)
- "Time-builders under $100k" → `/aircraft?max_price=100000`
- "Glass-panel singles" → `/aircraft?q=glass`
- "Cessna for sale" → `/aircraft?make=Cessna`
- "New this week" → `/aircraft` (default newest-first)
Each rail is rendered ONLY if it has >= MIN real listings (else dropped, never padded). Title is a `<Link>` to the filtered page.

## Acceptance criteria
1. At least one rail renders on `/` with REAL listings fetched via the existing `fetchAircraftPage` helper (no fabricated listings/stats); rails with too few listings are dropped, not padded.
2. Each rendered rail's title links to the correct existing `/aircraft?...` filtered page.
3. Rails scroll horizontally; at 375px the PAGE has ZERO horizontal overflow (documentElement & body scrollWidth − clientWidth = 0) while the rail row itself scrolls sideways.
4. Reuses `.ch-card` token + existing image component (`next/image`, lazy below-the-fold) + existing photo/price helpers — no new colors/deps, no schema/DB/SQL change.
5. The rest of the homepage (hero/airport-search, newest-partnerships, three explore cards, benefits, mission strip, browse-by-make, browse-by-state, FAQ, bottom CTA, footer) renders intact and unchanged.
6. `npx next build` + typecheck pass; no new console/hydration errors at desktop 1280 + 375px.

## Out of scope
- No removal/reorder of any existing homepage section.
- No new filter params, no query-logic change, no `globals.css`/token change.
- No schema/DB/SQL change; no `.env`/secrets.
- No partnership rails (this slice is for-sale aircraft only, to keep it tight).
