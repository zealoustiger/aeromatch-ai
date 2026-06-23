# ClubHanger Estimate — price-vs-market block on the listing detail page

## Goal
Give each internal for-sale aircraft page a "ClubHanger Estimate" block that tells a
buyer, in one honest line, how this plane's asking price compares to the going rate for
the same make+model family — e.g. "Priced $18k below similar Cirrus SR22s" with a
Good deal / Fair price / Priced high verdict (the Zillow-Zestimate analog).

## Lane
`[want]` — owed per the 1:1 (last non-bug cycle `home-rail-cards-internal-link` pulled
`[goal]`; last cycle PASS so no blocker). Builds the top **[P1][want] "ClubHanger
Estimate" — fair-value pricing** backlog item, **slice 3 (price-analysis block on the
detail page)**. Slice 1 (comp model) and slice 2 (per-card deal pill) already shipped as
`src/lib/aircraftComps.ts` (`compVsMarket`) + the `CompPill` on `AircraftSaleCard`.

## Scope (small — reuse the existing comp infra)
- `src/lib/aircraftComps.ts` — add a pure `clubHangerEstimate(askingPrice, familyPrices)`
  returning `{ verdict, median, compCount, deltaDollars, deltaPct }` or `null`. Reuses the
  same median / `MIN_OTHER_COMPS` / `DEAD_BAND` honesty rules already in this file.
- `src/lib/aircraftComps.test.ts` — new worked-example unit tests for the pure function.
- `src/lib/aircraftForSale.ts` — add a read-only `getFamilyAskingPrices(family)` that fetches
  the active priced asking prices for a make+model family (same query shape as
  `priceStatsForMakeModel`), so the estimate's comp set lines up with the family page.
- `src/app/aircraft/listing/[id]/page.tsx` — render a "ClubHanger Estimate" panel in the
  price sidebar when the listing has a real price AND the family has enough comps.

## Acceptance criteria
- On a listing in a dense family with a real price, the detail page shows a "ClubHanger
  Estimate" block with a verdict badge (Good deal / Fair price / Priced high) and a plain
  line stating the dollar + % distance from the family median, plus the comp count.
- The verdict is honest: below the median (beyond a ±5% dead band) → "Good deal"; within
  the dead band → "Fair price"; above → "Priced high". Percent + dollars are whole numbers.
- The block is **absent** (renders nothing) when: the listing has no asking price, the
  make+model doesn't resolve to a known family, or there are fewer than `MIN_OTHER_COMPS`
  (4) other priced comps — never a misleading estimate on thin data.
- A short disclaimer makes clear it's an estimate from current same-family asking prices
  (not an appraisal), with a link to the family page to see the comps.
- `next build` + typecheck green; `node --test src/lib/aircraftComps.test.ts` passes.
- QA smoke exit 0 (HTTP 200, zero app-origin console errors, zero horizontal overflow) at
  desktop 1280 + mobile 375 on a listing that carries the block; screenshots look right.

## Out of scope
- No card/grid changes (slice 2 deal pill already ships there).
- No year-band/hours weighting yet (current comp set is make+model family median — the
  honest, already-proven slice); note it as a follow-up.
- No schema/DB writes, no new dependencies, no changes outside the four files above.
