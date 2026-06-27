# Spec: avionics-partnership-detail

**Timestamp:** 2026-06-27T100026Z  
**Pillar:** Buyer analysis (Pillar 3)

## Goal
Surface the shared aircraft's avionics capability on partnership detail pages and in the PartnershipRailCard so IFR buyers can evaluate glass-panel / ADS-B / autopilot availability without reading through a listing description.

## Scope
- `src/app/partnerships/[id]/page.tsx` — import `classifyAvionics`, compute `avionicsInfo`, render an `AvionicsPanel` component in the main content column (between the description panel and the "How this stacks up" deal-signals panel).
- `src/components/PartnershipRailCard.tsx` — import `classifyAvionics`, compute top avionics cap from `p.avionics`, render a small overlay chip in the bottom-right of the photo (matching AircraftRailCard pattern). No prop changes needed — `p.avionics` is already in the `Partnership` type.

## Acceptance criteria
1. A partnership listing with extracted avionics data shows an "AVIONICS & PANEL" section in the main content column, with capability chips (Glass panel / ADS-B Out / Autopilot / WAAS GPS) and the raw equipment list in a 2-column bullet grid.
2. The section is absent on listings with no avionics data (`p.avionics` null or empty) — it self-suppresses.
3. The panel shows the same caveat as on aircraft listings: "Equipment list extracted from the seller's description. Verify with logbooks before purchase."
4. PartnershipRailCard photo overlay shows the top-priority avionics cap chip (Glass panel > ADS-B Out > Autopilot) in the bottom-right, with the correct color (violet/sky/emerald). Self-suppresses when no avionics data.
5. `npx next build` exits 0 (zero TypeScript errors).
6. QA smoke: HTTP 200, zero app-origin console errors, zero horizontal overflow at 1280 + 375 on `/partnerships`, `/partnerships/[id]` (with + without avionics data).

## Out of scope
- Changing the avionics extraction logic or Partnership DB schema.
- Fixing existing color-key mismatch in AircraftRailCard / AircraftSaleCard (separate scope).
- Adding avionics to the PartnershipCard browse list (a future slice).
