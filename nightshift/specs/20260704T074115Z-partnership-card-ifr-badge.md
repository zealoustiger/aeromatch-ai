# partnership-card-ifr-badge

## Goal
Mirror `AircraftSaleCard`'s synthesized IFR-suitability headline badge onto `PartnershipCard`, so a partnership browse card showing "full"/"capable" avionics tiers shows one honest synthesized verdict (e.g. "Full IFR touring setup") instead of 1-2 raw equipment chips — same proprietary buyer-analysis read aircraft-for-sale shoppers already get.

## Scope
- `src/components/PartnershipCard.tsx`:
  - Import `computeIfrSuitability`, `type AvionicsCap`, `type IfrTier` from `@/lib/avionicsClassify` (already imports `classifyAvionics`).
  - Add `IFR_CARD_CHIP` style map + `IfrCardBadge` component, ported verbatim from `AircraftSaleCard.tsx`.
  - Compute `ifrTier = computeIfrSuitability(avionicsCaps)?.tier ?? null` and `showIfrBadge = ifrTier === 'full' || ifrTier === 'capable'` alongside the existing `avionicsCaps` line.
  - In the badge row, replace the unconditional `avionicsCaps.map(...)` chip rendering with: `showIfrBadge ? <IfrCardBadge caps={avionicsCaps} /> : avionicsCaps.map(...)` (same branch AircraftSaleCard already uses).
- No schema change, no new query — `avionicsCaps` is already derived client-side from `p.description` via the existing `partnershipAvionicsCaps()` helper.

## Acceptance criteria
- `npx tsc --noEmit` and `npx next build` pass clean.
- A partnership card whose description implies a "full" or "capable" IFR tier (e.g. glass + WAAS + autopilot mentions) shows the single synthesized headline chip (e.g. "Full IFR touring setup") instead of 2 raw chips.
- A partnership card with only "equipped"/"basic" tier avionics (or none) is unchanged — still shows the raw chips (or nothing) as before.
- QA smoke passes (HTTP 200, zero console errors, zero horizontal overflow) at desktop 1280 + mobile 375 on `/partnerships` and `/saved`.
- No layout regression / overlap with existing badges (share type, New, registration, TrustBadge, engine chip, comp verdict, Compare toggle).

## Out of scope
- No changes to the partnership detail page or rail card (both already have this logic).
- No changes to `aircraft_for_sale`/`AircraftSaleCard`.
- No structured `avionics` column for partnerships (separate, larger, migration-sized item).
