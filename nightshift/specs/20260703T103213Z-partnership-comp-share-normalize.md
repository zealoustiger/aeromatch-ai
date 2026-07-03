# partnership-comp-share-normalize

## Goal
Fix an apples-to-oranges bug in the partnership "buy-in vs. market" comparison: it
currently compares raw buy-in dollars across same-make partnerships without
accounting for share size, so a small fraction (e.g. 1/8) reads as "below market"
against a large fraction (e.g. 1/2) purely because it's a smaller slice — not
because it's actually a better deal. Normalize the comparison to each listing's
implied full-aircraft value (`buy_in_price × total_shares`) before computing the
market delta, matching the honesty-gated, data-grounded standard in GOAL.md's
Pillar 3 (proprietary buyer analysis — never a confident-but-wrong signal).

## Scope
- `src/lib/partnershipComps.ts` — `partnershipBuyInComp` takes the subject's
  `total_shares` and each comp's `total_shares`; normalizes to implied full value,
  derives an "expected buy-in for a share this size" from the comp median, and
  requires `total_shares >= 2` on the subject and each comp (self-suppresses
  otherwise — same honesty-floor pattern as `MIN_OTHER_COMPS`). `getPartnershipCompVerdicts`
  selects `total_shares` alongside `buy_in_price` and threads it through.
- `src/app/partnerships/[id]/page.tsx` — comp query adds `total_shares`; call site
  passes it through; wording tweak ("expected" not "median") on the two spots that
  surface `partnerComp.median` as user-facing text.
- `src/components/SimilarListings.tsx` — comp query adds `total_shares`; call site
  passes it through.
- `src/components/PartnershipDealSignals.tsx` — wording tweak on the buy-in-vs-market
  signal detail text to reflect the share-normalized comparison.
- `src/components/PartnershipCard.tsx` — tooltip wording tweak only (no logic change).
- No schema change (uses the existing `total_shares` column).

## Acceptance criteria
- A partnership missing `total_shares` (or with `total_shares < 2`) never renders a
  below/above-market verdict (self-suppresses, same as missing buy-in price today).
- Two partnerships of the same make with identical implied full value but different
  share counts (e.g. 1/2 @ $100k vs 1/4 @ $50k) are no longer flagged as
  below/above market relative to each other purely from share-size difference.
- All 5 call sites (`/partnerships` browse, `/partnerships/[id]` detail +
  PartnershipDealSignals, `/partnerships/near/[icao]`, `/saved`, similar-listings
  rail) still render comp chips/panels for listings that do have `total_shares`.
- `npx next build` + `tsc --noEmit` pass clean.
- QA smoke passes on `/partnerships`, a `/partnerships/[id]` detail page, and
  `/partnerships/near/[icao]` at desktop 1280 + mobile 375 (HTTP 200, no console
  errors, no horizontal overflow).

## Out of scope
- The separate "implied aircraft value vs. for-sale market" signal (already
  share-normalized, unaffected).
- Backfilling `total_shares` on existing rows that lack it.
- Any change to the aircraft-for-sale (non-partnership) Deal Check/Estimate logic.
