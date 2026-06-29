# Spec: partner-buyin-inline-market

**Timestamp:** 2026-06-29T125647Z  
**Pillar:** Proprietary buyer analysis (Pillar 3)

## Goal

Add an inline compact market-position hint directly under the buy-in price in the partnership detail page's Costs sidebar card, so buyers see market context at the moment they notice the price — without needing to scroll to the separate `PartnershipMarketCheck` panel below.

## Scope

- `src/app/partnerships/[id]/page.tsx` — add ~8 lines of JSX inside the existing Costs `<dl>` after the buy-in `<dd>`. Import `formatPriceK` from `@/lib/utils`.

No new components, no new DB queries, no schema changes.

## Acceptance criteria

1. When `partnerComp` is non-null (≥4 same-make active partnerships with a buy-in price), a compact one-line market hint appears directly under the buy-in price `<dd>` in the Costs card.
2. Below-market: emerald text — "~28% below market · $25k median · 4 comps"
3. Above-market: amber text — "~15% above market · $25k median · 4 comps"
4. Near-market (within dead band): slate text — "Around market · $25k median · 4 comps"
5. When `partnerComp` is null (fewer than 4 comps or no buy-in price), no hint appears (self-suppresses, same as the existing `PartnershipMarketCheck`).
6. The existing `PartnershipMarketCheck` sidebar panel is UNCHANGED.
7. `npx next build` + `tsc --noEmit` pass clean.
8. `qa-smoke.mjs` exits 0 at desktop 1280 + mobile 375 on a partnership detail page.

## Out of scope

- Modifying `PartnershipMarketCheck` or `PartnershipDealSignals` components.
- Aircraft detail page changes.
- Any DB migrations or schema changes.
- Adding low/high price range (out of scope for this slice — `PartnerCompResult` doesn't carry them).
