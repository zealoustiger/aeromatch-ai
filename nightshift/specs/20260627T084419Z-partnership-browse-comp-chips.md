# Spec: partnership-browse-comp-chips

**Timestamp:** 20260627T084419Z
**Pillar:** Buyer analysis (Pillar 3)

## Goal
Show "Below market" / "Above market" buy-in comp chips on every `PartnershipCard` in
the `/partnerships` browse list, so buyers can immediately spot deals and outliers
without clicking into each listing.

## Scope
- `src/components/PartnershipList.tsx` — batch-fetch buy-in prices per unique make,
  compute `partnershipBuyInComp` for each listing, pass `compVerdict` down
- `src/components/PartnershipCard.tsx` — accept `compVerdict?: 'below' | 'above'`
  and render an emerald / amber chip in the badges row

**Out of scope:**
- No changes to the existing `PartnershipMarketCheck` sidebar or deal-signal panels
- No changes to seeker cards or aircraft cards
- No new DB tables or schema changes
- The "near market" verdict (±5% dead band) renders no chip — informational noise

## Acceptance criteria
1. `/partnerships` browse page: partnership cards with a buy-in price that is ≥4
   same-make comps away from the median (outside the ±5% dead band) show an emerald
   "Below market" or amber "Above market" chip in the badges row.
2. Cards with no buy-in price, or fewer than 4 same-make comps, or a buy-in within
   ±5% of the median, show no chip — the badge area is unchanged.
3. The chip never renders a fabricated or "near" verdict.
4. `npx next build` passes with zero TypeScript errors.
5. QA smoke on `/partnerships` at desktop 1280 + mobile 375: HTTP 200, zero
   app-origin console errors, zero horizontal overflow.
