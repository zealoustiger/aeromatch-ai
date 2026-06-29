# Spec: partner-listing-age-context

**Timestamp:** 20260629T082226Z  
**Branch:** night/partner-listing-age-context  
**Pillar:** Pillar 3 — Proprietary buyer analysis

## Goal
Add listing-age context to the `PartnershipMarketCheck` sidebar panel on partnership detail pages — "Listed 14 days ago — on the market longer than ~65% of the 12 comparable Cessna partnerships listed now — seller may have flexibility." Gives buyers market-freshness context in the exact sidebar location where they evaluate buy-in price; mirrors what `listing-age-context` shipped for aircraft listing EstimatePanels.

## Scope
- `src/app/partnerships/[id]/page.tsx` — extend the comp query to also fetch `created_at`; compute `domContext` via `computeDaysOnMarketContext` (already imported in the aircraft detail page, reusing the same lib); compute absolute `listed` string from `p.created_at`; pass both to `PartnershipMarketCheck`.
- `src/components/PartnershipMarketCheck.tsx` — add optional `domContext: DaysOnMarketContext | null` and `listed: string | null` props; render listing-age footer (same pattern as the EstimatePanel footer).
- `src/lib/daysOnMarket.ts` — no changes needed (pure helper, already exported).

## Acceptance criteria
1. `PartnershipMarketCheck` accepts optional `domContext` and `listed` props and renders a listing-age line below the existing disclaimer.
2. When `domContext.relative === 'longer'`: "Listed X days ago — on the market longer than ~Y% of the Z comparable {make} partnerships listed now" (+ "seller may have flexibility" when the listing is ≥ 30 days old).
3. When `relative === 'shorter'`: "Listed X days ago — listed more recently than ~Y% of the Z comparable {make} partnerships listed now."
4. When `relative === 'typical'`: "Listed X days ago — on the market about as long as the typical {make} partnership."
5. When `domContext` is null but `listed` is set, renders only the plain "Listed X days ago" line (no relative comparison — honesty floor: too few comps to compare).
6. When both are null/missing, no listing-age line renders — panel self-suppresses this footer gracefully.
7. `npx next build` green, `tsc --noEmit` clean, qa-smoke exit 0 on `/partnerships/[id]` at desktop 1280 + mobile 375.

## Out of scope
- Changes to any other page or component.
- Schema changes or new DB columns.
- Changing the comp query beyond adding `created_at` to the existing select.
- "Comparable partnerships near your airport" — that's a separate future slice.
