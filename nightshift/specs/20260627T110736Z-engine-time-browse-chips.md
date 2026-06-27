# Spec: engine-time-browse-chips

**UTC:** 2026-06-27T110736Z  
**Pillar:** Buyer analysis (Pillar 3) — proprietary engine health signal on discovery cards  
**Friction removed:** Buyers currently see "1,200 SMOH" on browse cards but have no context — they have to click into every listing to find out if the engine is fresh, approaching TBO, or already past it. This chip surfaces that verdict directly on the card.

## Goal
Add an "~X hrs to TBO" (or "Beyond TBO") chip to aircraft browse cards (`AircraftSaleCard`) using the same `lookupEngineTbo` table already powering the detail-page Engine Life panel. Chip self-suppresses when `smoh` or `engine_type` is missing, or when the engine type doesn't match a known piston-GA family. No DB changes — purely derived from data already on the browse query's `select('*')` result.

## Scope
- **`src/components/AircraftSaleCard.tsx`** — import `lookupEngineTbo`, compute remaining hours, add `EngineTimeChip` helper, render in the badge row (after the avionics chips)
- **No other files** (detail page, rail cards, DB, actions — all out of scope)

## Acceptance criteria
1. Browse cards with `smoh` + an engine type that resolves to a known TBO family show a compact chip (e.g. "~800 hrs to TBO") in the badge row.
2. Chip is color-coded: emerald when > 50 % TBO remaining, sky when > 15 %, amber when 0–15 %, amber "Beyond TBO" when past TBO.
3. Cards where `smoh` is null, `engine_type` is null, or the engine type is not in the TBO table show **no chip** (self-suppresses cleanly).
4. Hours rounded to the nearest 50 for compact display; if ≥ 1 000 hrs, show "~1.8k hrs to TBO".
5. `npx next build` exits 0 with zero TypeScript errors.
6. QA smoke (`next start` production build) exit 0 on `/aircraft` at desktop 1280 + mobile 375 — HTTP 200, zero app-origin console errors, zero horizontal overflow.

## Out of scope
- `AircraftRailCard.tsx` (homepage / similar-aircraft rails) — deferred to follow-on cycle
- Partnership or seeker listings (no engine_type field in those tables)
- Changing the Engine Life panel on the detail page
- Any DB migration
