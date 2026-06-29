# Spec: browse-comp-count

**UTC:** 2026-06-29T120216Z  
**Pillar:** Pillar 3 — proprietary buyer analysis  
**Slug:** browse-comp-count

## Goal

Aircraft browse cards currently show "~18% below average" (or "Near average" / "~X% above average") via the `CompPill`, but give no denominator — the buyer has no idea whether that comparison is backed by 4 listings or 40. Add the comp count to the `CompPill` so buyers scanning the grid immediately see the market depth behind the claim (e.g., "~18% below avg · 15 comps").

## Scope

- `src/lib/aircraftComps.ts` — add `count: number` and `median: number` to `CompResult`; update `compVsMarket` to return them (these are already computed internally; just thread them through)
- `src/components/AircraftSaleCard.tsx` — update `CompPill` to render the count alongside the percentage: "~18% below avg · 15 comps" / "Near avg · 15 comps" / "~X% above avg · N comps"

## Acceptance criteria

1. `CompResult` interface includes `count: number` (the number of *other* same-family priced comps used) and `median: number` (the reference median in whole dollars).
2. `CompPill` shows the comp count for all three variants (`below`, `near`, `above`) — e.g., "~18% below avg · 15 comps".
3. Count is always ≥ `MIN_OTHER_COMPS` (4) because `compVsMarket` enforces that threshold before returning.
4. When `dealVerdict` is non-null, `comp` is still null — no regression on the DealCheckChip path.
5. `npx next build` + `tsc --noEmit` both exit 0.
6. `qa-smoke.mjs` passes at desktop 1280 + mobile 375 on `/aircraft`.

## Out of scope

- Adding the median price to the pill display (adds length; count is enough for this slice)
- Changing the partnership `PartnerCompResult` / `PartnerMarketCheck` (separate lib)
- Any new DB queries or schema changes
