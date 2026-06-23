# Spec — Similar aircraft on the listing detail page (slice 3)

**Lane:** `[want]` (last non-bug cycle `listing-detail-jsonld` pulled `[goal]`; last cycle
PASS so no blocker → `[want]` owed per the 1:1). Top `[P1][want]` backlog item
"Internal listing detail pages", **slice 3 (similar listings)**. Also the
`[P2][want] "Similar planes" comparables on every listing` item.

## Goal
Add a "Similar aircraft for sale" module to `/aircraft/listing/[id]` so a buyer who lands
on one plane can keep browsing real, related listings on-site (the Zillow/Redfin "more
homes like this" loop) — which also adds crawlable internal links between detail pages
(an INDEXING-stage leading-indicator win).

## Scope (small)
- `src/lib/aircraftForSale.ts` — add `getSimilarAircraftForSale(current, limit)`: active,
  excludes the current listing, same make, **$50k buyer-quality floor** (reuse the existing
  sitemap floor — no parts/junk in "similar"), ranked in JS by make+model family match >
  same state > similar price, recency tiebreak. Fails soft → `[]`.
- `src/components/SimilarAircraft.tsx` — new server component; renders the real
  `AircraftSaleCard` (which already links **internally** to each listing's detail page).
  Renders nothing when there are no matches.
- `src/app/aircraft/listing/[id]/page.tsx` — render `<SimilarAircraft current={p} />`
  full-width below the main grid (mirrors how `/partnerships/[id]` mounts `SimilarListings`).

## Acceptance criteria
- [ ] A listing with same-make active priced (≥$50k) neighbours shows a "Similar aircraft
      for sale" section with up to 3 real cards; same make+model family ranks first.
- [ ] The current listing never appears in its own similar list; every card links to
      another `/aircraft/listing/[id]` detail page (internal, crawlable).
- [ ] When there are no sensible matches (junk/blank make, or nothing ≥$50k same-make),
      the section renders nothing — no empty heading, no fabricated cards.
- [ ] Only real listings are shown — no placeholder/synthetic rows; honesty-rule clean.
- [ ] `next build` + typecheck pass; QA smoke PASS (HTTP 200, no app-origin console
      errors, no horizontal overflow) at desktop 1280 + mobile 375; screenshots look right.

## Out of scope
- The "ClubHanger Estimate"/deal-score price-analysis block (separate `[want]` item).
- Wiring the homepage `AircraftRailCard` to the detail page (slice 4 remainder).
- Any schema change, new card design, or carousel — reuse the existing `AircraftSaleCard`.
