# aircraft-deals-candidate-scan-fix

## Goal
Fix `fetchUnderMarketDeals()` (powers `/aircraft/deals` and the homepage `DealsRail`) so it (1) scans the FULL active/priced candidate population instead of being silently capped at 1000 rows by a single unscoped `.limit(2000)` call, and (2) actually applies the `DEAL_MIN_PRICE` ($50k) floor on every call — today it's only applied when `photoOnly === true` due to a JS statement-continuation bug, so the real `/aircraft/deals` page (which calls with `photoOnly` defaulted to `false`) has NO price floor at all.

## Scope
- `src/components/AircraftSaleList.tsx` — `fetchUnderMarketDeals()` only (lines ~741-786). Reuse the existing `fetchAllRows()` pagination helper (already used by `fetchFamilyPriceMap`/`fetchFamilyCompMap` in the same file, added by the recent `aircraft-comp-map-pagination-fix` cycle) — no new helper, no schema change, no new dependency.
- No change to `fetchFamilyPriceMap`, `fetchFamilyCompMap`, `compVsMarket`, or any caller signature (`fetchUnderMarketDeals(limit, photoOnly)` keeps its exact signature).

## Bugs being fixed (both confirmed directly, not assumed)
1. **Row-cap bug (honesty-guardrail bug, Pillar 3):** `query.limit(2000)` is a single unscoped Supabase call; PostgREST silently truncates any unscoped request to the project's max-rows setting (1000), confirmed live in the prior `aircraft-comp-map-pagination-fix` cycle (2121 active/priced rows today, single `.limit(5000)` returned exactly 1000). Since `fetchUnderMarketDeals` never scores candidates beyond row 1000, genuine bargains in the untouched ~half of the population can never appear on the deals page or homepage rail.
2. **Missing price-floor bug:** `if (photoOnly) query = query.eq('image_is_placeholder', false)` is immediately followed on the next line by `.gte('asking_price', DEAL_MIN_PRICE)` with no semicolon — confirmed via a standalone Node repro that this is ONE chained statement inside the `if`, so the $50k floor is only ever applied when `photoOnly === true` (the homepage `DealsRail` call). The actual `/aircraft/deals` page calls `fetchUnderMarketDeals(48)` with `photoOnly` defaulted to `false`, so it currently has no price floor at all — a listing priced far below $50k (data artifact, placeholder, or a genuinely tiny/partial-share item) could appear as a "deal" with a huge, implausible discount.

## Implementation
Replace the single `query.limit(2000)` call with `fetchAllRows((from, to) => ...query.range(from, to))`, matching the established pattern in the same file. Move the `.gte('asking_price', DEAL_MIN_PRICE)` filter onto the unconditional query chain (applies regardless of `photoOnly`); keep `image_is_placeholder` filtering conditional on `photoOnly` only.

## Acceptance criteria
- [ ] `fetchUnderMarketDeals` no longer calls `.limit(2000)`; it pages through the full matching population via `fetchAllRows`/`.range()`.
- [ ] `DEAL_MIN_PRICE` ($50k) is applied on every call, including the default `photoOnly = false` path used by `/aircraft/deals`.
- [ ] `image_is_placeholder` filtering still applies only when `photoOnly === true` (homepage rail behavior unchanged).
- [ ] `npx next build` and `tsc --noEmit` both exit 0.
- [ ] `/aircraft/deals` and the homepage (`/`, which renders `DealsRail`) both return HTTP 200 with zero new app-origin console errors and zero horizontal overflow at desktop 1280 + mobile 375 via `qa-smoke.mjs`.
- [ ] No schema change, no new dependency, no change to any frozen path.

## Out of scope
- Any UI/visual change to the deals page or rail (this is a pure data-correctness fix, no rendering change).
- Raising the Supabase project's PostgREST max-rows setting (that's a human/infra decision, not code).
- Any other `.limit()`-without-`.range()` call sites elsewhere in the codebase beyond this one function.
