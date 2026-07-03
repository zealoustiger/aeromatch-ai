# earnings-calculator-ios-zoom-fix

## Goal
Stop iOS Safari's auto-zoom-on-focus on the `EarningsCalculator` widget's number
inputs (embedded on `/partnerships/new`) by bumping their mobile font-size to 16px,
closing the exact follow-up flagged by the `post-forms-ios-zoom-fix` cycle
(2026-07-03): "the `EarningsCalculator` widget's two number inputs are still 14px,
unfixed (out of scope, different component)."

## Scope
- `src/components/EarningsCalculator.tsx` — the shared `NumberField` input
  (`text-sm` → `text-base sm:text-sm`), same pattern already applied to the three
  post forms in `post-forms-ios-zoom-fix` (commit `f950160`).
- No other files. No schema change. No behavior change beyond font-size.

## Acceptance criteria
- Every `NumberField` input rendered by `EarningsCalculator` (both `full` and
  `compact` variants) computes to 16px font-size at a 375px viewport.
- Desktop (1280px) rendering is visually unchanged (14px via the `sm:` breakpoint).
- `npx next build` + `npx tsc --noEmit` pass clean.
- QA smoke (`qa-smoke.mjs`) passes on `/partnerships/new` (where the `full` variant
  renders) at desktop 1280 + mobile 375: HTTP 200, zero app-origin console errors,
  zero horizontal overflow.
- No layout regression — the calculator's grid, spacing, and results panel render
  identically to before aside from the input font-size bump.

## Out of scope
- The `/tools/earnings-calculator` standalone page (uses the same component, so it
  inherits the fix for free, but isn't separately re-verified beyond the smoke gate).
- Any other component or post-form field (already fixed in `post-forms-ios-zoom-fix`).
- Redesigning or adding fields to the calculator.
