# cost-calc-model-alert

## Goal
Make the "Estimate your cost to own a {Make Model}" link from a curated make/model
page carry that aircraft identity into `/tools/cost-calculator`, so the page's alert
capture there is model-scoped ("Alert me for Cessna 172 listings") instead of the
generic partnership-only box, when the visitor arrived with a known aircraft in mind.

## Scope
- `src/app/aircraft/[make]/[model]/page.tsx` — the existing "Estimate your cost to
  own a {label} →" link (line ~246) gets `?make=...&model=...` query params.
- `src/app/tools/cost-calculator/page.tsx` — accept `searchParams` (`Promise<{make?,
  model?}>`, matching the codebase's async-searchParams convention), and when both are
  present, swap the hardcoded `<AlertSignup noun="partnership" sourcePath="/partnerships"
  .../>` for an aircraft-scoped one: `noun="aircraft"`, `context={`${make} ${model}`}`,
  `sourcePath={`/aircraft?make=...&model=...`}` — the exact convention already used by
  `aircraft/listing/[id]/page.tsx`'s sold-listing alert. No make/model → falls back to
  today's generic partnership box (unchanged).

## Out of scope
- No change to `CostCalculator.tsx`'s numeric inputs/defaults — there's no honest
  make/model → typical-cost lookup to prefill from (flagged in the backlog audit as a
  separate, bigger feature).
- No change to `ShareCostPanel.tsx` or any other cost-calculator caller.
- No new query-param wiring beyond the one existing caller identified with real
  make/model context in scope.

## Acceptance criteria
- Visiting `/aircraft/cessna/172` and clicking "Estimate your cost to own a Cessna
  172 →" lands on `/tools/cost-calculator?make=Cessna&model=172`.
- On that URL, the page renders an `AlertSignup` with aircraft copy ("Cessna 172"),
  not the generic partnership box, and a real submission would write a
  `/aircraft?make=Cessna&model=172`-shaped `source_path` (matches the existing
  `/aircraft` alert-matching convention — no cron/parsing change needed).
- Visiting `/tools/cost-calculator` directly (no query params) renders exactly as
  before — the generic partnership `AlertSignup`, unchanged copy.
- `npx next build` + typecheck pass.
- `qa-smoke.mjs` passes (200, no console errors, no horizontal overflow) at desktop
  1280 + mobile 375 on `/tools/cost-calculator`, `/tools/cost-calculator?make=Cessna&model=172`,
  and `/aircraft/cessna/172`.
