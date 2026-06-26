# Spec: financial-calculators-ship

**UTC timestamp:** 2026-06-25T130000Z
**Slug:** financial-calculators-ship

## Goal
Ship the near-complete financial calculators from branch `feat/financial-calculators` (PR #17): a standalone `/tools/cost-calculator` page + a standalone `/tools/earnings-calculator` page, both linked from the footer and embedded compactly on the partnership post form.

## Scope
Files from the feature branch integrated into staging:
- `src/app/tools/cost-calculator/page.tsx` — new page (full-mode CostCalculator)
- `src/app/tools/earnings-calculator/page.tsx` — new page (full-mode EarningsCalculator)
- `src/components/CostCalculator.tsx` — interactive cost calculator widget (full + compact variants)
- `src/components/EarningsCalculator.tsx` — interactive earnings calculator widget (full + compact variants)
- `src/lib/calculators.ts` — pure math library (computeCost, computeEarnings, shareFractionFromType)
- `src/lib/calculators.test.ts` — unit tests (excluded from TS build via tsconfig)
- `src/components/Footer.tsx` — adds "Tools" section linking both calculators
- `src/app/partnerships/new/page.tsx` — adds compact EarningsCalculator below post form
- `tsconfig.json` — excludes `**/*.test.ts` from TS compilation

The `/tools` hub page and the `/aircraft/listing/[id]` CostCalculator embed already exist in staging — no change needed.

## Acceptance criteria
1. `GET /tools/cost-calculator` returns HTTP 200 at both desktop 1280 and mobile 375.
2. `GET /tools/earnings-calculator` returns HTTP 200 at both viewports.
3. Both pages render without app-origin console errors.
4. Footer "Tools" section is visible on the homepage with links to both calculators.
5. `/partnerships/new` still loads without errors (compact EarningsCalculator embedded below the form).
6. No horizontal overflow at 375px on any affected page.

## Out of scope
- Rate limiting / cost caps on the calculator (no API calls — pure client-side math)
- Adding the calculators to the aircraft-for-sale detail page
- A/B testing or analytics on calculator usage
