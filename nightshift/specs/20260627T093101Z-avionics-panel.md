# Spec: avionics-panel

**UTC:** 20260627T093101Z
**Slug:** avionics-panel
**Pillar:** 3 — Proprietary buyer analysis on listing pages

## Goal
Convert the flat `avionics[]` comma-list on aircraft listing detail pages into a structured
"Avionics & panel" module that classifies extracted equipment into key buyer-facing capability
chips (Glass Panel / ADS-B Out / Autopilot / WAAS GPS) and displays the full equipment list —
giving IFR buyers an at-a-glance panel assessment no other listing site provides.

## Scope
- `src/lib/avionicsClassify.ts` — new pure helper: pattern-match `string[]` → capability chips + raw list
- `src/app/aircraft/listing/[id]/page.tsx` — remove avionics from the specs grid; add `AvionicsPanel` inline component between the Specs grid and the Deal Score panel

## Acceptance criteria
1. When `avionics` is null or empty, the panel does not render (no regression for listings without extracted avionics data)
2. When `avionics` has items, an "Avionics" panel renders in the main column between the Specifications grid and the "How this stacks up" (Deal Score) panel
3. Detected capability chips appear at the top of the panel when matched:
   - "Glass panel" (G1000, G3000, Entegra, Avidyne, EFIS, etc.)
   - "ADS-B Out" (ADS-B, UAT)
   - "Autopilot" (S-TEC, GFC 500/700, KAP 140, etc.)
   - "WAAS GPS" (GTN series, GNS 430W/530W, GNC 355, etc.)
   - "GPS navigator" (non-WAAS GPS fallback when WAAS not detected)
4. The full avionics item list renders below the chips as a 2-column bullet list
5. The avionics row is removed from the Specifications grid (no duplication)
6. `npx next build` passes with zero TypeScript errors

## Out of scope
- Unit tests (the classification logic is simple substring matching; QA smoke covers the rendering gate)
- Avionics chips on browse cards or rails (next cycle if valuable)
- Any DB schema change
- Modifications to other pages
