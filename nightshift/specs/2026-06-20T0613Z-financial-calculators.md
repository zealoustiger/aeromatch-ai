# Cost + earnings calculators (financial-calculators)

Lane: **[want]** · BACKLOG [P1][want] "Cost + earnings calculators" (re-filed from the 6/14 run).

## Goal
Ship two standalone, mobile-first decision tools — `/tools/cost-calculator`
(co-ownership cost split) and `/tools/earnings-calculator` (leaseback earnings) —
by adapting the near-complete code from branch `feat/financial-calculators` (PR #17)
onto current `staging`, and link them in the footer.

## Scope (small — bring the 6 isolated files over, adapt for taste)
- `src/lib/calculators.ts` — pure math (computeCost / computeEarnings / shareFractionFromType). Take as-is.
- `src/lib/calculators.test.ts` — worked-example unit tests. Take as-is, must pass.
- `src/components/CostCalculator.tsx` — client component. Recolor any non-sky accents to sky.
- `src/components/EarningsCalculator.tsx` — client component. Recolor emerald → sky (sky-blue accent only).
- `src/app/tools/cost-calculator/page.tsx` — route + metadata + canonical. Recolor accents to sky.
- `src/app/tools/earnings-calculator/page.tsx` — route + metadata + canonical. Recolor accents to sky.
- `src/components/Footer.tsx` — add a "Tools" links group pointing at both calculators.

## Acceptance criteria
1. `npx next build` + TypeScript pass; the calculator unit tests pass.
2. `/tools/cost-calculator` renders at desktop + 375px with no horizontal overflow and no console errors/hydration warnings, and computes correctly (matches the worked example: 1/3 C172-style inputs → sensible all-in monthly, true $/hr, vs-renting & vs-owning comparisons).
3. `/tools/earnings-calculator` renders at desktop + 375px with no overflow/console errors, and computes correctly (dues income + flying margin → monthly offset, upfront from buy-ins, fixed-coverage bar).
4. Editing an input live-updates the results (client interactivity works under the production build).
5. Both tools are reachable from the site footer.
6. Sky-blue accent only — no emerald/new palette introduced (amber retained only as a semantic "costs more" warning, not an accent).

## Out of scope
- Compact/embedded variants wired into listing pages (the components support `variant="compact"` but no page embeds this cycle).
- Any DB/schema change (none needed — pure client math).
- Pulling any of the other stale files from `feat/financial-calculators` (admin/aircraft/etc. — old, would clobber staging).
- A nav (top-bar) link — footer link satisfies the discoverability requirement; keep nav unchanged.
