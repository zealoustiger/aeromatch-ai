# partnership-card-engine-chip

## Goal
Show the same "hrs to TBO" engine-life chip on the `PartnershipCard` browse card that
`AircraftSaleCard` already shows, so a shopper scanning `/partnerships` gets the same
engine-life signal a same-page aircraft-for-sale shopper already gets — closing a real
Pillar 3 (proprietary buyer-analysis) parity gap confirmed by source audit (partnership
detail page already computes a full `EngineLifePanel` from `smoh`/`engine_type`; the
browse card renders neither field anywhere).

## Scope
- `src/components/PartnershipCard.tsx`: import `lookupEngineTbo` from `@/lib/engineLife`,
  port the `EngineTimeChip`/`formatHrsRemaining`/`engineChipStyle` helpers from
  `AircraftSaleCard.tsx` (same recipe, same styling), render the chip in the badge row
  when `p.smoh != null && p.engine_type` is truthy.
- No schema change — `partnerships.smoh`/`engine_type` are existing columns (already on
  the `Partnership` type, already used by the detail page's `EngineLifePanel`).
- No change to `AircraftSaleCard.tsx`, the partnership detail page, or `PartnershipRailCard`.

## Acceptance criteria
- `PartnershipCard` shows an "~N hrs to TBO" (or "Beyond TBO") chip when both `smoh` and
  `engine_type` are present and `engine_type` matches a known TBO family; renders nothing
  extra otherwise (self-suppresses, same honesty floor as the aircraft card).
- Chip styling (color by fraction-remaining) and copy match `AircraftSaleCard`'s
  `EngineTimeChip` exactly.
- `npx next build` + `tsc --noEmit` pass with zero errors.
- QA smoke passes on `/partnerships` (and any other route rendering `PartnershipCard`
  reachable without auth) at desktop 1280 + mobile 375: HTTP 200, zero app-origin
  console errors, zero horizontal overflow.
- No layout regression — existing badges (share type, New, registration, TrustBadge,
  avionics chips, comp verdict, Compare toggle) render unchanged alongside the new chip.

## Out of scope
- `PartnershipRailCard.tsx` (compact cross-sell card — per prior cycle's note, not a
  strict parity target given its condensed format).
- The IFR-suitability synthesized headline badge (a separate candidate slice, not this one).
- Any change to how `smoh`/`engine_type` are collected or classified.
