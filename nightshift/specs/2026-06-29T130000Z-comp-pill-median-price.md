# Spec: comp-pill-median-price

**Timestamp:** 2026-06-29T130000Z  
**Pillar:** 3 — Proprietary buyer analysis  
**Branch:** night/comp-pill-median-price

## Goal
Show the market median price inside the comp pill on aircraft browse cards, giving buyers an absolute dollar anchor to interpret the "X% below/above avg" claim. The `CompResult.median` field is already computed and available; this cycle makes it visible.

## Motivation
A buyer scanning browse results sees "~18% below avg · 15 comps" but has no idea whether that means $97k vs $118k or $280k vs $341k — two very different buying decisions. Surfacing the compact median ("~18% below avg · $118k · 15 comps") makes the comparison instantly interpretable without requiring a click to the detail page.

## Scope
Files expected to touch:
- `src/lib/utils.ts` — add `formatPriceK(n: number): string` compact formatter ("$118k", "$1.2M")
- `src/components/AircraftSaleCard.tsx` — update `CompPill` to show compact median and add `title` tooltip with full median

## Acceptance criteria
1. Aircraft browse cards with a comp pill show the compact median price between the percentage and the comp count: "~18% below avg · $118k · 15 comps"
2. "Near avg" variant shows: "Near avg · $118k · 15 comps"
3. "Above avg" variant shows: "~8% above avg · $118k · 15 comps"
4. The `<span>` elements carry a `title` attribute with the full median in standard format: "vs. median $118,000"
5. The compact formatter renders $Xk for prices <$1M, $X.XM for ≥$1M, rounded to nearest $1k/$100k
6. No horizontal overflow at desktop 1280 or mobile 375 — existing comp pills stay within the badge row
7. Smoke exit 0 on /aircraft (HTTP 200, zero app-console errors, zero overflow)

## Out of scope
- The deal check chip (DealCheckChip) — that's a different pill showing the year+hours controlled verdict; no change
- The detail page EstimatePanel — already shows median and range fully; no change
- Partnership comp pills — not applicable (different comp system)
- Changes to the comp logic itself — median is already computed, just not displayed
