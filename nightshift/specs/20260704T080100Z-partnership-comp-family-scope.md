# partnership-comp-family-scope

## Goal
Fix the partnership buy-in "below/above market" comp (Pillar 3, proprietary buyer
analysis) to compare a listing against other active partnerships of the same
**make + model family** — not just the same make — matching the honesty-floor
precision the ClubHanger Estimate (`aircraftComps.ts`) already uses for
aircraft-for-sale comps.

## Why (honesty bug, not a new feature)
`src/lib/partnershipComps.ts` (`getPartnershipCompVerdicts`) and
`src/app/partnerships/[id]/page.tsx`'s inline comp fetch both filter comps with
`.eq('make', make)` only. A Cessna 172 1/4-share partnership is today benchmarked
against every other active "Cessna" partnership regardless of model (172, 182,
206, Citation…), share-normalized but never model-normalized. GOAL.md explicitly
requires reusing "the existing honesty floors ... from the ClubHanger Estimate as
the bar" — the Estimate resolves comps via `resolveMakeModelFamily` (make+model),
so this is a real gap against that stated bar, not a stylistic nit.

## Scope
- `src/lib/partnershipComps.ts`:
  - `getPartnershipCompVerdicts` — select `model` alongside `id, buy_in_price,
    total_shares`; group/compare comps by resolved make+model family
    (`resolveMakeModelFamily`, same helper `aircraftComps.ts` uses) instead of
    raw `make`. Self-suppress (no verdict) when a listing's make+model doesn't
    resolve to a known family — same honesty-conservative behavior
    `aircraftComps.ts` already has for aircraft-for-sale.
- `src/app/partnerships/[id]/page.tsx`:
  - The inline "other same-make partnerships" comp query — select `model` too,
    filter the fetched comps down to the same resolved family before computing
    `partnerComp` (the buy-in verdict). Leave `partnerDomContext` (days-on-market)
    on the broader make-level set — that's a market-activity signal, not a price
    claim, so the honesty gate doesn't require model-level narrowing there.

## Out of scope
- `getSeekerBudgetCheck` / `getSeekerBudgetCheckVerdicts` (seeker budget check) —
  `PartnershipSeeker.preferred_models` is unstructured free text (e.g. "172, 182,
  PA-28"), so honest family resolution needs either a cleaner single-model
  extraction or its own slice. Left as a follow-up (noted in CHANGELOG).
- No schema change. No UI change — same chips/panels, just a narrower, more
  honest comp set feeding them.
- No change to `partnershipBuyInComp`'s share-normalization math itself.

## Acceptance criteria
- `npx next build` + typecheck pass.
- `getPartnershipCompVerdicts` and the detail-page comp fetch both narrow their
  comp set to the same resolved make+model family before computing a verdict.
- A partnership whose make+model doesn't resolve to any `SEO_MAKE_MODELS` family
  renders no comp chip/panel (self-suppresses) rather than falling back to a
  make-only comparison.
- `/partnerships` (browse cards) and `/partnerships/[id]` (detail page) both
  still render without errors; QA smoke passes on both paths at desktop+mobile.
- No behavior change to `getSeekerBudgetCheck`/verdicts (out of scope, untouched).
