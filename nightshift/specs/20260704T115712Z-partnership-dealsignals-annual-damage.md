# partnership-dealsignals-annual-damage

## Goal
Fold the already-computed annual-inspection and damage-history reads into the
partnership detail page's "How this partnership stacks up" synthesis panel
(`PartnershipDealSignals`), matching the aircraft-for-sale equivalent
(`computeDealSignals` on `/aircraft/listing/[id]`), so a buyer skimming the
headline verdict doesn't miss a maintenance/safety flag that's only shown
further down the page.

## Scope
- `src/components/PartnershipDealSignals.tsx` — add `annualStatus`/`damage`
  params to `computeSignals()` and two new signal rows, copy mirrored verbatim
  from `src/app/aircraft/listing/[id]/page.tsx`'s `computeDealSignals` rows 4–5
  (Annual current / Annual due soon / Annual may be overdue; No damage
  reported / Prior damage reported).
- `src/app/partnerships/[id]/page.tsx` — pass the existing `annualStatus` and
  `damage` values (already computed at lines ~365-366) into
  `<PartnershipDealSignals ... />`.
- No schema change, no new queries — both values already exist in scope on
  the page; this is purely wiring + two new self-suppressing rows.

## Acceptance criteria
- `PartnershipDealSignals` accepts optional `annualStatus`/`damage` props and
  folds them into `computeSignals()` as two additional rows, self-suppressing
  (no row) when the corresponding value is `null` — never fabricates a status.
- Row copy/severity mirrors the aircraft page exactly: current→positive,
  soon→neutral, overdue→negative for annual; clean→positive,
  reported→negative for damage.
- `/partnerships/[id]` passes both props through; existing behavior for
  listings with unknown annual/damage data is unchanged (rows simply don't
  render, same as today).
- `npx next build` + typecheck pass.
- QA smoke passes on `/partnerships/[id]` (and one general `/partnerships`
  browse page) at desktop 1280 + mobile 375: HTTP 200, no new console errors,
  no horizontal overflow.
- No visual regression on the existing panel layout — this is a copy-cycle
  (non-visual: new text rows in an existing pattern, no new component/CSS),
  so screenshots are saved for the audit trail but do not need to be read.

## Out of scope
- Avionics/IFR-suitability row (secondary candidate from the audit) — a
  separate, upside-only follow-on, not this cycle's slice.
- Any change to `AnnualStatusPanel`/`DamageHistoryPanel` themselves (they stay
  as standalone panels further down the page) — this only adds a condensed
  tally row to the top synthesis panel, it doesn't remove the detail panels.
- Aircraft-side `computeDealSignals` — already correct, untouched.
