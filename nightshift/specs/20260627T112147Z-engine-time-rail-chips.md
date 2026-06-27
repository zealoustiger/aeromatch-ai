# Spec: engine-time-rail-chips

**Timestamp:** 2026-06-27T112147Z
**Pillar:** Buyer-analysis (Pillar 3) — extends engine TBO chip coverage to rail cards

## Goal
Add the engine time-to-TBO overlay chip to `AircraftRailCard` so buyers can
see engine freshness at a glance in homepage rails and the "Similar aircraft"
rail on listing detail pages — completing chip coverage across all aircraft
surfaces (detail page → browse cards → rail cards).

## Scope
- **1 file:** `src/components/AircraftRailCard.tsx`
  - Import `lookupEngineTbo` from `@/lib/engineLife`
  - Add `formatHrsRemaining`, `engineChipStyle`, `EngineTimeChip` helpers
    (mirrors `AircraftSaleCard` — no shared-util extraction this cycle)
  - Render chip at `bottom-2 left-2` in photo overlay when
    `!isPlaceholder && p.smoh != null && p.engine_type`

## Acceptance criteria
1. Rail cards with `smoh` + `engine_type` present show a chip like "~800 hrs to TBO"
   or "Beyond TBO" at bottom-left of the photo overlay.
2. Colour-coded: emerald (>50 % TBO remaining), sky-blue (15–50 %), amber (<15 % or
   beyond TBO) — same thresholds as browse-card chip.
3. Cards where `smoh` or `engine_type` is null/missing show no engine chip
   (correct self-suppression).
4. Cards with a placeholder photo (`isPlaceholder = true`) continue to show
   "Not actual plane photo" text at bottom-left; no engine chip appears there.
5. Avionics chip at `bottom-2 right-2` is unaffected.
6. No layout breakage at 375 px mobile viewport.
7. `npx next build` passes (zero TypeScript errors).

## Out of scope
- `PartnershipRailCard` (no `smoh`/`engine_type` columns on partnerships table)
- `AircraftSaleCard` (already done)
- Scraper/ingest changes
- Backend/DB changes
