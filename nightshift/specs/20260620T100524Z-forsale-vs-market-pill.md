# forsale-vs-market-pill — "vs market" comp badge on for-sale cards

## Goal
On the planes-for-sale cards, show a small, honest **"~X% below / above average" (or "near average") pill** comparing THAT listing's asking price to the **median asking price of other ACTIVE for-sale listings of the same make+model family** — surfaced across `/aircraft`, `/aircraft/[make]/[model]`, and `/aircraft/for-sale/[state]` at once (all three render via `AircraftSaleList`).

## Why (goal lane)
GOAL.md `[goal]` lane: unique, linkable, shareable market data is the SEO/shareability lever. A real "below/above market" signal makes the for-sale pages more useful and share-worthy than a bare aggregator listing. Slice 1 of the "price-vs-market insight" backlog item. Lane `[goal]` (prior non-bug cycle `saved-aircraft-view` pulled `[want]`; 1:1 alternation → `[goal]`). Scoreboard at orient = 61 pageviews/7d.

## Comp math (honest, with a guardrail)
- For a listing L with a real `asking_price`, resolve its make+model FAMILY via the existing `resolveMakeModelFamily(make, model)` (the same single-source-of-truth the card already uses for its "See all … for sale" link). Listings whose make+model don't resolve to a known family get **no pill** (we can't define a clean comp set).
- Comp set = the asking prices of **all OTHER active listings in the same family** that have a real `asking_price` (exclude L itself; exclude null/`price_text`-only).
- **Guardrail (built in, not skipped):** require **≥ 4 OTHER comps** (so ≥ 5 priced listings in the family including L). Document: 4 chosen because below that the median is too noisy to make a trustworthy public claim; sparse families show **nothing** — never a fake/empty badge.
- Compute `median(comps)`. `delta = (L.price - median) / median`.
- **Dead-band:** if `|delta| < 0.05` (within ±5%), show a neutral **"Near average"** pill (no fake precision claiming "3% below"). Otherwise show **"~N% below average"** / **"~N% above average"** where N = `round(|delta|*100)` rounded to the nearest 1% (sensible rounding, no decimals).
- Below average = good for a buyer → subtle **positive** (sky/emerald) treatment; above average = neutral/informational (slate). Near average = slate.
- A listing with no `asking_price` → no pill. A family with < 4 other priced comps → no pill.

## Scope (small, additive, read-only)
- NEW pure helper file `src/lib/aircraftComps.ts`: build a family→sorted-prices map from a flat list of `{make, model, asking_price}`, and a pure `compVsMarket(listing, familyPriceMap)` returning `null | { kind: 'below'|'above'|'near', pct: number }`. No DB, no React — unit-pure.
- EDIT `src/components/AircraftSaleList.tsx`: one extra lightweight read (`make, model, asking_price` for active priced listings, `.limit(5000)`, mirrors `topStatesForMakeModel`), build the family price map once, pass each card its `comp` result. Non-fatal on failure (no pill).
- EDIT `src/components/AircraftSaleCard.tsx`: render the pill in the existing badges row (so it never overlaps the heart on the photo or the Compare toggle). Accept a `comp` prop.

## Acceptance criteria
1. On `/aircraft/cessna/172` (a dense family), priced listings show a "% below/above average" or "Near average" pill; a known-cheap listing reads "below" and a known-expensive one reads "above" (spot-check the math against the family median).
2. A sparse family (< 4 other priced comps) and any listing with no asking price show **no pill** at all (no empty/fake badge).
3. The pill lives in the badges row, never overlaps the heart/Save button or the Compare toggle, at desktop and 375px. Zero horizontal overflow at 375px.
4. `npx next build` green; `npx tsc --noEmit` adds no new errors in touched files (the 3 pre-existing `.test.ts` baseline errors are acceptable).
5. No new console errors / hydration warnings on the production build at desktop + 375px.
6. Sky-blue accent only (below = sky/emerald positive, above/near = slate); no dark patterns, no fake precision.

## Out of scope
- Slice 2 "market snapshot on model pages" (a stats block on `/aircraft/[make]/[model]`) — NOT this cycle.
- Any schema/DB change, any new route, any per-aircraft detail page.
- Year/condition/hours-adjusted comps (just same-family median this slice).
