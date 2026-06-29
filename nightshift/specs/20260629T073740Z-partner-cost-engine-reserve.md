# Spec — partner-cost-engine-reserve

**UTC**: 20260629T073740Z  
**Slug**: partner-cost-engine-reserve  
**Pillar**: 3 — Proprietary buyer analysis  

## Goal
Fold the engine overhaul reserve estimate into the PartnerShareCostPanel so partnership buyers see their true cost of co-ownership: fixed costs + hourly fuel/variable + engine reserve — the full picture no other listing site shows in context.

## Background
`computeEngineLife` is already called on the partnership detail page (`engineLife`), which returns `reservePerHour` (overhaul cost ÷ TBO hours). However, this data is NOT passed to `PartnerShareCostPanel`, so the Flying Cost panel currently shows only stated monthly fixed and hourly-wet rates — missing the engine reserve that is a real cost of piston-GA ownership.

The `partner-share-cost-panel` CHANGELOG `Next:` note explicitly teed this up: "the cost-to-own panel could also show a per-partner engine-reserve estimate now that the partnerships smoh/ttaf/engine_type migration is pending."

## Scope
- `src/components/PartnerShareCostPanel.tsx` — add `reservePerHour` and `engineFamily` optional props; render a reactive reserve row (varies with hrs/yr tab); clearly labeled as estimated and subject to what's already in the monthly fixed
- `src/app/partnerships/[id]/page.tsx` — pass `engineLife?.reservePerHour` and `engineLife?.family` to `PartnerShareCostPanel`

## Acceptance criteria
1. When `reservePerHour` is non-null and > 0, a "Engine reserve (est.)" row appears in the breakdown section, computing `reservePerHour × hrsPerYear` per tab — the amount updates when the user taps between 50/75/100/150 hrs/yr
2. The row is labeled "Estimated — verify if included in monthly fixed" (honest, non-fabricated)
3. Engine reserve is NOT folded into the main `annualTotal` used for break-even vs. renting (to avoid double-counting with partnerships that include reserve in their monthly fixed)
4. When `reservePerHour` is null/missing/0, the row does not render — no change to existing behaviour
5. The partnership detail page passes `engineLife?.reservePerHour` and `engineLife?.family` correctly
6. `npx next build` and `tsc --noEmit` pass with 0 new type errors
7. QA smoke exits 0 at desktop 1280 + mobile 375 on `/partnerships/[id]`: HTTP 200, zero app-origin console errors, zero horizontal overflow

## Out of scope
- Folding reserve into the break-even total (risk of double-counting)
- Aircraft for-sale ShareCostPanel (different structure)
- Any DB schema change
- Any change to `computeEngineLife` or its unit tests
