# earnings-calculator-upfront-runway

## Goal
Add the "more detail" insight line the earnings calculator was missing — how many months of
the aircraft's full monthly fixed cost the one-time partner buy-ins alone would cover — mirroring
the cost calculator's existing `breakEvenHoursVsRenting` derived-insight pattern.

## Scope
- `src/lib/calculators.ts`: add `upfrontCoversMonthsOfFixedCost: number | null` to
  `EarningsResult` / `computeEarnings()` — `upfrontFromBuyIns / monthlyFixedTotal` when both are
  positive, else `null` (no divide-by-zero, no fabricated number).
- `src/lib/calculators.test.ts`: worked-example + null-edge-case unit tests for the new field.
- `src/components/EarningsCalculator.tsx`: surface a new note under the existing "Fixed costs
  covered by dues" bar on the `full` variant only (mirrors `CostCalculator`'s conditional
  break-even note placement/style) — "The $X upfront from buy-ins alone would cover about N
  months of your full aircraft costs."

## Acceptance criteria
- `computeEarnings` returns a correct `upfrontCoversMonthsOfFixedCost` for the worked example
  and returns `null` when `monthlyFixedTotal` or `upfrontFromBuyIns` is 0 (no NaN/Infinity).
- `/tools/earnings-calculator` (full variant) renders the new line, updates live as inputs
  change, no layout shift/overflow at 1280 or 375px.
- The `compact` variant (used inline elsewhere) is unchanged — no new line added there.
- `npx tsc --noEmit` and `npx next build` stay clean.
- No fabricated numbers — value is `null` (not shown) whenever it can't be honestly derived.

## Out of scope
- Any change to the cost calculator itself.
- New inputs/fields on the earnings calculator form.
- Any schema/DB change (this is a pure client-side derived calculation).
