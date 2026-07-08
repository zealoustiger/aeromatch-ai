# Tools page-family design-token sweep

## Goal
Finish the "Etsy × Airbnb" design-token sweep (`nightshift/BACKLOG.md` [P3][want]
"slice 5: token sweep") on the `/tools` page family — the last two remaining
families are "guides" and "tools"; this cycle does "tools".

## Scope
- `src/app/tools/page.tsx` — the hub page's list-item cards already sit on a
  `.ch-surface` wrap but use a hand-rolled `rounded-2xl border-slate-200 bg-white`
  instead of the shared `.ch-card` utility (radius + soft shadow + hover-lift).
- `src/components/CostCalculator.tsx` and `src/components/EarningsCalculator.tsx`
  (both `full` and `compact` variants) — panels use the pre-token-sweep
  `rounded-xl border-slate-200 bg-white shadow-sm` pattern instead of `.ch-panel`
  (neutral panels) or `rounded-2xl` (colored accent panels, matching the existing
  sky "Interested?" card convention on `/partnerships/[id]`).
- Purely presentational (className changes only) — no logic, schema, or copy change.

## Acceptance criteria
- `/tools`, `/tools/cost-calculator`, `/tools/earnings-calculator` all render with
  the shared `ch-card`/`ch-panel` rounded-2xl + soft-shadow treatment, consistent
  with `/aircraft`, `/partnerships`, and the airport detail pages.
- `CostCalculator`/`EarningsCalculator` `compact` variant (embedded on
  `/partnerships/new`) picks up the same radius/shadow bump with no behavior change.
- No new component, color, or dependency; no schema/DB change.
- `npx next build` + typecheck pass.
- QA smoke passes (200 / no console errors / no horizontal overflow) at desktop
  1280 + mobile 375 on `/tools`, `/tools/cost-calculator`, `/tools/earnings-calculator`,
  `/partnerships/new`.

## Out of scope
- The "guides" page family (separate future slice).
- Any functional/logic change to the calculators.
- Normalizing `--ch-border` color usage beyond the panels touched here.
