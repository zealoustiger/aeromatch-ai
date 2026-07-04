# partnership-rail-card-engine-chip

## Goal
Add the same engine-life/TBO overlay chip that `AircraftRailCard` already shows to `PartnershipRailCard`, closing a Pillar 3 (buyer-analysis) parity gap between the two rail-card components.

## Scope
- `src/components/PartnershipRailCard.tsx` — add an `EngineOverlayChip` (mirroring `AircraftRailCard.tsx`'s implementation: `lookupEngineTbo` from `src/lib/engineLife.ts`, `formatHrsRemaining`, `engineChipStyle` helpers), rendered bottom-left on the photo overlay when `p.smoh != null && p.engine_type` and not a placeholder photo (same condition ordering as `AircraftRailCard`).
- No changes to `src/lib/engineLife.ts` (reuse `lookupEngineTbo` as-is, already exported).
- No schema change — `Partnership.smoh`/`Partnership.engine_type` already exist on the type (`src/lib/types.ts:50-51`) and are already used by `PartnershipCard.tsx`'s `EngineTimeChip`.
- Affected pages: `/aircraft` (unaffected — sanity check only), `/partnerships` (unaffected), and any page rendering `SimilarListings`/`MarketplaceCrossSell` partnership rails — primarily `/partnerships/[id]` (Similar partnerships rail) and `/aircraft/listing/[id]` (marketplace cross-sell rail).

## Acceptance criteria
- `PartnershipRailCard` renders a bottom-left chip reading "~N hrs to TBO" or "Beyond TBO" (color-coded emerald/sky/amber by remaining fraction, same as `AircraftRailCard`) whenever the partnership has both `smoh` and a recognized `engine_type`, and is not showing a placeholder photo.
- Chip self-suppresses (renders nothing) when `smoh` or `engine_type` is missing, or when `engine_type` doesn't match a known TBO family — no fabricated data.
- Existing avionics overlay chip (top-right) and compVerdict badge (top-left) are unaffected — no layout collision with the new bottom-left chip (mirrors how `AircraftRailCard` already avoids overlap between its bottom-left engine chip and bottom-left "Not actual plane photo" badge — mutually exclusive, same pattern here).
- `npx next build` + typecheck pass clean.
- QA smoke passes (HTTP 200, zero console errors, zero horizontal overflow) at desktop 1280 + mobile 375 on `/partnerships/[id]` (a listing whose Similar rail includes a partnership with smoh+engine_type if available in seed data) and `/partnerships`.
- No regression to `AircraftRailCard` or any aircraft-side rendering (file untouched).

## Out of scope
- Extending the annual-due/damage-history chip to rail cards (deprioritized per prior audit — lower-traffic surfaces).
- Any change to the seeker detail page's date-formatting inconsistency (cosmetic, unrelated).
- Any change to the full `PartnershipCard`/`AircraftSaleCard` browse cards (already have this signal).
