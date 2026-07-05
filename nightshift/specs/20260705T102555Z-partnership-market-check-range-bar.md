# partnership-market-check-range-bar

## Goal
Give the partnership detail page's "Partnership market check" panel the same visual
low–high price-range bar + percentile framing the aircraft-for-sale "ClubHanger
Estimate" panel already has, so buyers see where a partnership's buy-in sits within
the real comp spread, not just a single median sentence.

## Scope
- `src/lib/partnershipComps.ts` — extend `PartnerCompResult` with `low`, `high`,
  `percentile` (per-share dollar low/high of the same comp set already computed in
  `partnershipBuyInComp`, and the whole-percent of comps priced below this buy-in).
  Reuses the existing sorted `impliedValues` array — no new query, no new honesty
  floor (still gated by the existing `MIN_OTHER_COMPS` check).
- `src/components/PartnershipMarketCheck.tsx` — render the low–high gradient bar with
  a median tick + "this listing" marker, low/high end-labels, and a legend, mirroring
  `EstimatePanel`'s bar in `src/app/aircraft/listing/[id]/page.tsx` (lines ~1494-1534).
  Update the descriptive sentence to state the range + percentile when `high > low`
  (same pattern as `EstimatePanel`'s headline paragraph), falling back to today's
  plain median sentence when there's no real spread (all comps identical price).

## Acceptance criteria
- `PartnerCompResult` has `low`/`high`/`percentile` fields populated whenever
  `partnershipBuyInComp` returns non-null (all 3 kinds: below/near/above).
- `low`/`high` are the per-share (not full-aircraft-implied) dollar bounds of the
  same comp set already used for the median — i.e. scaled by the subject's own
  `totalShares`, consistent with how `median`/`deltaDollars` are already scaled.
- `percentile` is the whole-percent of the comp set priced below this listing's
  buy-in (0 = cheapest, 100 = priciest) — computed only from real comp values, never
  fabricated.
- The panel renders a visual bar (median tick + listing marker) only when
  `high > low`; when the comp set has zero spread (all comps equal), it falls back to
  the existing plain-median copy with no bar (no divide-by-zero, no fake bar).
- No behavior change to `partnerComp === null` (self-suppress unchanged) or to the
  existing `DealCheck` sub-block.
- `npx next build` passes with no new type errors.

## Out of scope
- Any change to the Deal Check narrowed-comp verdict (`partnershipDealVerdict`).
- Porting this to the seeker budget-check panel (seeker budgets are a single number,
  not a comp-set spread in the same shape) — out of scope this cycle.
- Any schema/migration change.
