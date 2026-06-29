# Spec: ifr-badge-browse-cards
**Timestamp:** 2026-06-29T105848Z
**Pillar:** Buyer analysis (Pillar 3)

## Goal
Surface the synthesized IFR suitability verdict (already computed on detail pages) directly on `AircraftSaleCard` browse cards, so buyers scanning the `/aircraft` list immediately see "Full IFR setup" or "IFR-capable" for glass-panel aircraft instead of raw "Glass panel" + "ADS-B Out" capability chips.

## Scope
- `src/components/AircraftSaleCard.tsx` — the only file touched

## Acceptance criteria
1. For 'full' IFR tier (glass + WAAS + autopilot): a compact emerald `Full IFR setup` badge appears in the card's badge row, replacing the individual avionics caps chips.
2. For 'capable' IFR tier (glass or WAAS + partial): a compact sky-blue IFR verdict badge appears (e.g. "Glass panel with autopilot"), replacing the individual avionics caps chips.
3. For 'equipped', 'basic', or null tier: individual avionics caps chips render unchanged (no regression).
4. No layout regression at desktop 1280 or mobile 375 (no overflow, no broken chips).
5. Badge self-suppresses when no avionics data is available (avionics is null/empty) — unchanged from today.

## Out of scope
- Modifying the aircraft listing detail page (already has the IFR panel)
- Modifying the partnership detail page
- Adding tooltip/hover text (the card chip label is sufficient; detail page is one click away)
- Any DB change or query change
