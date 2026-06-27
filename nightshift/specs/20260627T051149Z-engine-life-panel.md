# Spec: Engine Life & Overhaul Reserve Panel

**Timestamp:** 2026-06-27T05:11:49Z
**Slug:** engine-life-panel
**Pillar:** 3 — Proprietary buyer analysis

## Goal
Add an honest, data-grounded "Engine life" panel to `/aircraft/listing/[id]` that tells buyers how many hours remain before the engine's TBO, and what they should budget annually as an overhaul reserve — information no other listing site surfaces.

## Scope
Files expected to touch:
- **NEW** `src/lib/engineLife.ts` — pure TBO lookup + compute helper (no DB, no React)
- **NEW** `src/lib/engineLife.test.ts` — unit tests for the helper
- `src/app/aircraft/listing/[id]/page.tsx` — import helper + add `EngineLifePanel` inline function + call in page body

## Acceptance criteria
1. When a listing has both `smoh` (a number) and a recognizable `engine_type` string, an "Engine life" panel appears in the main content column of `/aircraft/listing/[id]`, between the Specifications panel and the Price history panel.
2. The panel shows: engine family name, TBO, hours remaining (or "Beyond TBO" when smoh >= TBO), and a per-year engine reserve budget estimate.
3. When `smoh` > TBO, the panel renders a clear "Beyond TBO" warning rather than a negative number.
4. When either `smoh` or `engine_type` is null, OR when `engine_type` cannot be matched to a known engine family, the panel is completely absent (no empty placeholder, no zero values).
5. The TBO lookup is deterministic, curated, and honest — uses real published TBO values per engine family; says "not enough data" via suppression rather than fabricating a number.
6. `npx next build` passes with no TypeScript errors.
7. QA smoke exits 0 on `/aircraft/listing/[id]` (the existing test listing UUID) at desktop 1280 + mobile 375.

## Out of scope
- Turbine/turboprop engine TBOs (piston GA only this slice)
- Dynamic TBO data from an external source
- Remaining life for avionics, props, or airframe
- Editing/overriding the TBO from the listing detail page
- Any DB schema change
