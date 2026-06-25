# Spec — hide-sub50k-listings

## Goal
Apply a global `asking_price >= 50 000` buyer-surface floor to every aircraft-for-sale
query on the site, so the ~211 sub-$50k rows (verified parts/projects: "M20C COWLING",
"O-235 MAGS", "PROPELLER BLADES", rivet-gun kits) and the 514 no-price rows never
surface in the browse, counts, or family pages.

## Why (lane)
`[bug]` / blocker lane: a known data-quality defect is showing parts listings as aircraft
across all buyer-facing surfaces — browse, make/model/state counts, cross-sell, price stats.
The sitemap already has this floor (`SITEMAP_PRICE_FLOOR` in `aircraftForSale.ts`), so this
change brings the buyer surfaces into parity with what we tell Google is index-worthy.

## Scope
Single file change: `src/components/AircraftSaleList.tsx`
- Add `BUYER_PRICE_FLOOR = 50_000` constant.
- Add `.gte('asking_price', BUYER_PRICE_FLOOR)` to every buyer-facing query in this file:
  `countMakeModel`, `countMakeModelState`, `countForSaleState`, `countForSale`,
  `topStatesForMakeModel`, `topMakeModelsForState`, `priceStatsForMakeModel`,
  `fetchAircraftPage`, `fetchFamilyPriceMap`.

## Acceptance criteria
- `npx next build` + typecheck pass (no new errors in touched files).
- `/aircraft` browse no longer shows listings under $50k or with no price.
- `/aircraft/cessna/172`, `/aircraft/cessna`, `/aircraft/for-sale/ca` all return HTTP 200
  with plausible (lower but non-zero) counts in title/H1.
- Cross-sell card on `/partnerships` shows a lower-but-accurate for-sale count.
- QA smoke exit 0 on all affected paths at desktop 1280 + mobile 375 (HTTP 200, zero
  app-origin console errors, zero horizontal overflow).

## Out of scope
- Slice 2 (suppress no-price listings from homepage curated collections — they already
  have `min_price=50000` via HomeRails but `no_price` rows may still sneak through
  `photoOnly` paths — deferred).
- Updating `getAircraftFacets` in `aircraft-facets.ts` (make/model filter options — lower
  impact since parts mostly share makes/models with real aircraft; deferred).
- No schema change; no ingest change; no new pages.
- Partnerships unaffected (buy-in ≠ asking price).
