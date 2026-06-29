# Spec: partnership-signals-engine-spec

**Timestamp:** 20260629T064320Z
**Slug:** partnership-signals-engine-spec
**Pillar:** Pillar 3 — proprietary buyer analysis

## Goal
Add engine-life and spec-completeness signals to the "How this partnership stacks up" tally on partnership detail pages — folding the engine-life read (already computed on the page) into the headline verdict, and adding a directional "specs present / specs missing" row so buyers know whether the Engine Life and Airframe panels below have data to show.

## Scope
- `src/components/PartnershipDealSignals.tsx` — accept `engineLife: EngineLifeResult | null`; add signal rows 5 and 6
- `src/app/partnerships/[id]/page.tsx` — pass `engineLife` to `PartnershipDealSignals`
- No schema, DB, query, or route changes

## Acceptance criteria
1. When `computeEngineLife` resolves (smoh + engine_type match a known TBO family), the tally shows an engine-life row with bands identical to the aircraft DealScorePanel: positive "Engine has life left" (>40% TBO remaining), neutral "Mid-time engine" (15–40%), negative "Approaching TBO" (≤15%), negative "Engine past TBO" (beyond TBO)
2. When smoh or engine_type is missing or unrecognised, no engine row appears — the lib self-suppresses; never fabricate a TBO
3. When smoh + engine_type are both provided on the listing, a positive "Engine specs on listing" row appears
4. When neither smoh nor engine_type is provided (most current listings), a neutral "Engine/airframe specs not on listing — ask owner for SMOH and engine type" row appears instead
5. The panel still self-suppresses (returns null) when fewer than 2 total signal rows are actionable
6. `/partnerships/[id]` smoke gate: HTTP 200, zero app-origin console errors, zero horizontal overflow at desktop 1280 + mobile 375

## Out of scope
- "N in this listing's favor / N to ask about" tally chips (a future enhancement)
- Changing how engineLife is computed (reuse the existing call in the page)
- Aircraft detail page (unchanged)
