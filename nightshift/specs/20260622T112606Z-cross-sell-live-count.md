# Cross-sell live count — Blend result types slice 2

## Goal
Add a **real, make-aware live count** of the *other* marketplace to the cross-sell
card at the bottom of `/partnerships` and `/aircraft` (e.g. "Browse 412 Cirrus
aircraft for sale" / "See 8 Cirrus co-ownership partnerships"), so a visitor sees
how much inventory exists the other way before tapping through.

## Scope (small)
- `src/components/MarketplaceCrossSell.tsx` — accept an optional `count?: number`;
  weave it into the visible body copy (shown at all viewports) when > 0.
- `src/components/AircraftSaleList.tsx` — add `countForSale(make?)` (active for-sale
  count, optional `ilike make`), mirroring `countForSaleState`.
- `src/lib/partnershipsQuery.ts` — add `countActivePartnerships(make?)` (active
  partnership count, optional `ilike make`), mirroring `countPartnershipsByMake`.
- `src/app/partnerships/page.tsx` — compute `countForSale(params.make)` → card.
- `src/app/aircraft/page.tsx` — compute `countActivePartnerships(params.make)` → card.

## Acceptance criteria
- `npx next build` + typecheck green.
- On `/partnerships` the cross-sell body shows the live count of planes for sale;
  on `/partnerships?make=Cirrus` it shows the Cirrus-only count and the link still
  carries `?make=Cirrus`. Mirror on `/aircraft` for partnerships.
- Counts are REAL (from the DB) — never fabricated; when the count is 0 (or
  unavailable) the card falls back to the slice-1 countless copy (no "0 …").
- No layout/visual regression: card still renders as one sky card below the
  listings; QA smoke exit 0 at desktop 1280 + mobile 375 on both pages.
- Additive only — no schema/DB/SQL change, no new dependency/color, no FREEZE file.

## Out of scope
- The sticky side-panel with 2-3 sample listings from the other type (a later slice).
- Blending the third "pilots" type; changing the link/target logic.
