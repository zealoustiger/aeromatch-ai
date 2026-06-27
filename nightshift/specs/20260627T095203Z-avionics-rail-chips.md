# Spec: avionics-rail-chips
**Timestamp:** 2026-06-27T095203Z  
**Pillar:** Buyer-analysis (Pillar 3)

## Goal
Show the top avionics capability chip (Glass panel / ADS-B Out / Autopilot) on `AircraftRailCard` so buyers can identify IFR-capable aircraft at a glance in the homepage curated rails and the "Similar aircraft" rail on listing detail pages — matching the avionics chips already live on browse cards (`AircraftSaleCard`) and listing detail pages.

## Scope
- `src/components/AircraftRailCard.tsx` — import `classifyAvionics` + `cn`; compute top cap from `p.avionics`; render 1 chip in the photo overlay (bottom-right corner, styled to match `AircraftSaleCard` avionics chips)

No other files.

## Acceptance criteria
1. Rail cards for listings with a recognised avionics pattern (glass panel, ADS-B, autopilot, WAAS GPS, GPS nav) show exactly 1 chip in the bottom-right of the photo overlay.
2. Chip colour coding matches `AircraftSaleCard`: violet for glass panel, sky for ADS-B Out, emerald for Autopilot, sky for WAAS GPS, slate for GPS navigator.
3. Rail cards with no avionics data (null or empty array) show no chip (clean self-suppression).
4. The existing deal chip (top-left) and placeholder badge (bottom-left) are unaffected.
5. Card dimensions are unchanged — rails stay correctly aligned at desktop 1280 and mobile 375.

## Out of scope
- More than 1 chip per rail card
- Avionics chips on `PartnershipRailCard` or partnership browse cards
- Any data-layer changes (avionics already in `select('*')`)
