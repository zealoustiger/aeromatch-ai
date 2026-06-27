# Spec: partnership-market-check

**Timestamp:** 2026-06-27T07:37:57Z  
**Pillar:** Buyer analysis (Pillar 3)  
**Slug:** partnership-market-check

## Goal
Show whether a partnership's buy-in is competitively priced vs. other active same-make partnerships on ClubHanger — the ClubHanger Estimate analog for the partnership marketplace. Gives buyers proprietary price context no other platform offers.

## Scope
- **New** `src/lib/partnershipComps.ts` — pure comp helper (no DB, no React); same honesty philosophy as `aircraftComps.ts`
- **New** `src/components/PartnershipMarketCheck.tsx` — presentational sidebar panel; renders nothing when comp data is insufficient
- **Modified** `src/app/partnerships/[id]/page.tsx` — add same-make buy-in fetch from Supabase + render the panel in the sidebar (between Costs and Structure)

## Acceptance criteria
1. Partnership detail page shows a "Partnership market check" panel in the sidebar when ≥4 OTHER active same-make partnerships with a real buy-in price exist
2. Panel shows: verdict badge (Below market / Around market / Above market), headline describing the delta, comp count + median buy-in
3. Panel self-suppresses completely (renders nothing) when `buy_in_price` is null OR fewer than 4 comps exist — never shows a number when data is too sparse
4. Honesty-gated: MIN_OTHER_COMPS = 4, DEAD_BAND = ±5% — same standards as the aircraft ClubHanger Estimate
5. Panel includes a caveat: "Share types and partner counts vary — compare listing details."
6. No new DB schema; additive-only query; no changes to aircraft pages

## Out of scope
- Normalizing buy-in by share fraction (raw buy-in is the natural sticker comparison)
- CompVerdict chips on the SimilarListings rail (separate future slice)
- Changes to aircraft listing pages
- Any changes to the partnerships table or schema
