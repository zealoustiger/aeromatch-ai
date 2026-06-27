# Spec: deal-verdict-browse-chips

**UTC:** 2026-06-27T12:16:22Z  
**Pillar:** Buyer-analysis (Pillar 3)  
**Slug:** deal-verdict-browse-chips

## Goal
Surface the ClubHanger Deal Check verdict (year- and hours-controlled) on aircraft browse cards, so buyers can spot genuine bargains and avoid overpriced listings at a glance without clicking into every detail page.

## Background
The detail page already ships a "Deal check" panel (`clubHangerDealVerdict`) that controls for similar year (±5yr) and similar hours before calling a listing a "Good deal" or "Priced high." The browse cards currently only show the whole-family `CompPill` ("~X% below/above average"), which can mislead — a 1970 Cessna 172 looks "below market" vs 2020s simply due to age. The deal verdict is strictly more accurate when data is available.

## Scope
- `src/components/AircraftSaleList.tsx`: add `fetchFamilyCompMap`, compute deal verdict per listing, pass to card
- `src/components/AircraftSaleCard.tsx`: accept `dealVerdict` prop, render `DealCheckChip`; suppress CompPill when deal verdict is shown

## Acceptance criteria
1. Browse cards with `year` + `ttaf` + ≥4 similar-year/hours comps show a deal verdict chip in the badge row.
2. "Good deal" renders as an emerald chip; "Priced high" renders as an amber chip; "Fair price" renders no chip.
3. When `dealVerdict` is shown, `CompPill` is suppressed (one price-signal per card, no double-count).
4. Cards without sufficient controlled comps (missing year/ttaf, thin family) still show `CompPill` as before — no regression.
5. `npx next build` passes (zero TypeScript errors).
6. `qa-smoke.mjs` exits 0 on `/aircraft` at desktop 1280 + mobile 375 (HTTP 200, zero app-origin errors, zero horizontal overflow).

## Out of scope
- Deal verdict on rail cards (AircraftRailCard) or similar-aircraft sidebar — separate future slice
- Partnership browse cards — partnerships don't have year/ttaf in the same way
- Changing the detail page EstimatePanel — already ships the full verdict there
