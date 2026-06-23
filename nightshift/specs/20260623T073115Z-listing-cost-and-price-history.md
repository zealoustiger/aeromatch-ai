# Listing detail — cost-to-own estimate + price-history block

**Slug:** `listing-cost-and-price-history`
**Lane:** `[want]` — last non-bug cycle (`aircraft-listing-sitemap`) pulled `[goal]`; no blocker
outstanding (last cycle PASS), so `[want]` is owed per the 1:1. This is **slice 2** of the
top `[P1][want]` "Internal listing detail pages" item (slice 1 = the page itself; slice 4's
sitemap portion already shipped).

## Goal
Add a transparent **"Estimated cost to own"** block and a real-data **"Price history"** block
to `/aircraft/listing/[id]`, so a buyer can gauge running cost and see how the price has moved
(the Zillow/Redfin pattern the backlog explicitly cites) — without leaving the page.

## Scope (small, additive)
- `src/lib/calculators.ts` — add a pure, unit-testable `estimateOwnershipCost(askingPrice)`
  helper returning a transparent annual/monthly breakdown (insurance scales with hull value;
  hangar / annual-inspection / operating are clearly-labeled typical figures). No fabrication —
  every line is shown and labeled "estimate / typical".
- `src/lib/calculators.test.ts` — add a couple of assertions for the new helper.
- `src/app/aircraft/listing/[id]/page.tsx` — render two new server blocks:
  1. **Estimated cost to own** (only when `asking_price` present): the breakdown + est. monthly,
     a clear "rough estimate — your costs will vary" disclaimer, and a link to the full
     `/tools/cost-calculator`.
  2. **Price history** (only when `previous_price` + `price_changed_at` are present — real data):
     a 2-point timeline (listed → price changed) with the delta and % change. Hidden entirely
     when there's no recorded change (no thin/empty block).

## Acceptance criteria
- A priced listing shows an "Estimated cost to own" block with a per-line breakdown, an estimated
  monthly figure, a visible "estimate, costs vary" disclaimer, and a link to `/tools/cost-calculator`.
- The estimate's insurance line scales with the asking price (1% of hull value, floored); the other
  lines are labeled as typical/assumed figures, so nothing is presented as listing-specific that isn't.
- A listing **with** a recorded price change shows a "Price history" block with both prices, the
  change date, and the signed delta + %; a listing **without** one shows **no** price-history block.
- A no-price listing shows **neither** an estimate that implies a price nor a broken block.
- `npx next build` + `tsc --noEmit` clean (modulo the pre-existing `.test.ts` baseline errors).
- QA smoke exit 0 (HTTP 200, zero app-origin console errors, zero horizontal overflow) at desktop
  1280 + mobile 375 on `/aircraft` and a real `/aircraft/listing/[id]`; screenshots look right.

## Out of scope
- The "ClubHanger Estimate" fair-value/comps model (separate `[P1][want]` item).
- A price-history **chart** (we have at most 2 points; a timeline is honest for that).
- Slice 3 (similar listings) and the Vehicle/Offer JSON-LD half of slice 4.
- Any DB/schema change; any change to the cost math used by the existing calculators.
