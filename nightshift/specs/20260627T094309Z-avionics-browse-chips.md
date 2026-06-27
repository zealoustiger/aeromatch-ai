# Spec: avionics-browse-chips

**Timestamp:** 2026-06-27T094309Z  
**Pillar:** Buyer analysis (Pillar 3)  
**Slug:** avionics-browse-chips

## Goal
Surface avionics capability chips (Glass panel, ADS-B Out, Autopilot) on the aircraft browse card so IFR buyers can filter at a glance without clicking into every listing.

## Scope
- `src/components/AircraftSaleCard.tsx` — import `classifyAvionics`, call it on `p.avionics`, render up to 2 top-priority chips in the existing badge row.

## Acceptance criteria
1. When a listing has extracted avionics data containing a glass-panel indicator (G1000, Entegra, Avidyne, etc.), the browse card shows a violet "Glass panel" badge.
2. When a listing has ADS-B Out extracted, the browse card shows a sky-blue "ADS-B Out" badge.
3. When a listing has an autopilot extracted (and no glass/adsb), it shows an emerald "Autopilot" badge.
4. At most 2 avionics chips appear per card (top-priority first per `classifyAvionics` order: glass → adsb → autopilot → waas → gps).
5. Cards with no extracted avionics show no avionics chips (self-suppression).
6. All existing badges (source, grade, price drop, comp pill, New, registration) are unaffected.
7. Build clean, smoke exit 0 on `/aircraft` at desktop 1280 + mobile 375.

## Out of scope
- AircraftRailCard (homepage/similar-aircraft rails) — follow-up cycle.
- Server-side filtering by avionics type — browse filter is a separate item.
- Any change to avionics extraction logic or DB schema.
