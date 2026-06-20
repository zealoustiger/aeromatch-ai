# Market snapshot block on make+model for-sale pages

**Slug:** forsale-market-snapshot
**Lane:** [goal] (deliberate fall-through — [want] lane exhausted/blocked; slice 2 of the price-vs-market insight, builds on `forsale-vs-market-pill`)
**Scoreboard at orient:** 61 pageviews/7d

## Goal
Surface real **aggregate** market stats for a make+model family as unique, indexable content on `/aircraft/[make]/[model]` — a "Market snapshot" section showing the median asking price, number of priced listings, and price range (low–high) for THAT family, computed from the existing `aircraft_for_sale` inventory.

## Scope (files expected to touch — keep small)
- `src/lib/aircraftComps.ts` — add a pure, no-DB/no-React helper `priceStats(prices: number[]): { count, median, low, high } | null` (returns null below the min-listings threshold). Reuses the existing median logic philosophy.
- `src/components/AircraftSaleList.tsx` — add an exported server helper `priceStatsForMakeModel(make, modelPattern, notModelPattern)` that fetches `asking_price` for this family's active priced listings (mirroring `topStatesForMakeModel`'s query shape — `.eq('status','active').ilike('make',…).ilike('model',modelPattern)[.not(model, notModelPattern)].not('asking_price','is',null).gt('asking_price',0).limit(5000)`) and returns `priceStats(...)`. Read-only, non-fatal → null on any failure.
- `src/app/aircraft/[make]/[model]/page.tsx` — call the helper once, render a tasteful "Market snapshot" section (only when stats are non-null), placed near the specs/cost-to-own cards. Optionally add `AggregateOffer` to existing Product/Offer JSON-LD only if clean & valid; else skip.

## Acceptance criteria (QA grades against these)
1. On a dense family (`/aircraft/cessna/172`) the "Market snapshot" section renders with: median asking price, number of priced listings, and price range (low–high). Stats are CORRECT — spot-check median/low/high against the actual family listings.
2. **Honesty guardrail:** the section renders ONLY when there are ≥ 8 priced listings in the family. Same honesty philosophy as slice 1's pill but a notch stricter: the snapshot publishes a public median AND a low–high RANGE, which is far more outlier-sensitive than a single per-card "below/above" claim — with ~5 listings one mis-priced/project airframe (e.g. a $105k Robinson R44 against a $650–860k field) skews both. ≥8 cleanly separates dense families (Cessna 172=36, Cherokee=23, Bonanza=58, Mooney M20=53, Cirrus SR22=158, Cessna 182=38) from sparse ones (Robinson R44=5 → suppressed). A sparse family (`/aircraft/robinson/r44`) shows NO snapshot — no fake/empty stats.
3. Prices are rounded sensibly (no false precision — round to nearest $1,000 or show the real listing price; whole-dollar display, `$X,XXX` formatting). No fabricated numbers.
4. Sky-blue accent only; mobile-first; zero horizontal overflow at 375px; section looks right at 375px and desktop.
5. No new console errors / hydration warnings on the affected pages (production build).
6. Existing title/canonical/OG/ItemList JSON-LD intact; build + typecheck pass (only the 3 pre-existing `.test.ts` baseline errors allowed, none new in touched files). If JSON-LD AggregateOffer added, it parses and existing blocks are intact.

## Out of scope
- The per-card "vs market" pill (already shipped slice 1).
- Per-aircraft detail pages (no such route), by-state pages.
- Any schema/DB change. Any parallel duplicate inventory query (reuse the family query shape already on the page).
- year/hours-adjusted comps (future slice).
