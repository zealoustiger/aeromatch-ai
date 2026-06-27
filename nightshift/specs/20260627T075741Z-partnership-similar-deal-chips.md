# Spec: partnership-similar-deal-chips

**UTC:** 20260627T075741Z
**Branch:** night/partnership-similar-deal-chips

## Goal
Surface "Below market" / "Above market" buy-in chips on each card in the "Similar partnerships" rail on partnership detail pages — so buyers can compare price positioning across similar listings at a glance without opening each one.

## Scope
- `src/components/SimilarListings.tsx` — batch-fetch buy-in prices per unique make for the ranked similar set; compute per-listing comp verdict using `partnershipBuyInComp`; pass `compVerdict` to each `PartnershipRailCard`.
- `src/components/PartnershipRailCard.tsx` — accept `compVerdict?: 'below' | 'above'` prop; render emerald "Below market" or amber "Above market" chip on the photo (same position and styling as aircraft deal chips in `AircraftRailCard`).

## Acceptance criteria
- [ ] "Below market" (emerald) chip appears on `PartnershipRailCard` when the listing's buy-in is outside the ±5% dead band and below the same-make median (≥4 comps).
- [ ] "Above market" (amber) chip appears when above the median (same conditions).
- [ ] No chip renders when data is thin (<4 comps), buy-in is missing, or the listing is within the dead band — the card looks exactly as before.
- [ ] The existing PartnershipMarketCheck panel on the detail page is not affected.
- [ ] `npx next build` passes with zero TypeScript errors.
- [ ] QA smoke (`next start`) exits 0 on `/partnerships/[id]` and `/partnerships` at desktop 1280 + mobile 375.

## Out of scope
- Chips on partnership browse cards (`PartnershipCard` on `/partnerships`).
- Any change to the PartnershipMarketCheck sidebar panel.
- Changes to aircraft-side components.
