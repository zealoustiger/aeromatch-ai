# cost-calculator-breakeven-hours

## Goal
Add a "break-even hours/month vs. renting" figure to the cost calculator so a pilot
can see exactly how much they need to fly for a partnership to beat renting — the
concrete slice of the open `[P2][want] Expand tools/calculators + on-page feedback
ask` backlog item (the feedback-ask half is already shipped site-wide via the global
`FeedbackWidget` in `layout.tsx` — audit-confirmed this cycle, no code needed there).

## Scope
- `src/lib/calculators.ts` — extend `CostResult`/`computeCost` with
  `breakEvenHoursVsRenting: number | null` (null when renting can never be beaten,
  i.e. `hourlyWet >= rentalRate`).
- `src/lib/calculators.test.ts` — add worked-example + edge-case unit tests.
- `src/components/CostCalculator.tsx` — surface the figure in the `full` variant's
  "How it compares" section (new line under the renting `CompareRow`, only rendered
  when `rentalRate > 0`).

## Acceptance criteria
- `computeCost` returns a correct `breakEvenHoursVsRenting` (monthlyFixed /
  (rentalRate - hourlyWet)) when `rentalRate > hourlyWet`, and `null` when
  `rentalRate <= hourlyWet` (renting never loses on a per-hour basis).
- Unit tests cover: a normal case, the "renting always cheaper" null case, and
  `rentalRate === 0` (no comparison requested → null, no divide-by-zero).
- `/tools/cost-calculator` renders the new line only when a comparison is possible;
  copy is honest ("You need N+ hrs/month for this share to beat renting").
- No change to any other calculator output (backward-compatible field addition).
- `npx tsc --noEmit` and `npx next build` clean.
- QA: production build smoke test on `/tools/cost-calculator` (desktop 1280 + mobile
  375) — HTTP 200, no console errors, no horizontal overflow. Visual cycle → read
  screenshots.

## Out of scope
- The `compact` variant embed (kept lean; full calculator only).
- Any change to `EarningsCalculator` or `estimateShareCosts`.
- The deferred `/partnerships` model-variant DB-casing normalization (separate,
  human-blocked item).
