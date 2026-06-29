# Cost-to-own: true cost per flight hour (aircraft listing)

## Goal
Add the single number a pilot actually benchmarks an aircraft against — the **true
cost per flight hour** — to the Cost-to-own panel on the aircraft for-sale detail page,
so a buyer can compare "owning this works out to ~$X/hr" against the ~$Y/hr they'd pay
to rent, directly answering Pillar 3's "what will it really cost me to fly?"

## Pillar / rotation
Pillar 3 (proprietary buyer-analysis). Most recent cycle was Pillar 1
(aircraft-make-freetext-datalist); the one before Pillar 3 (engine-overhaul-timeline)
— most recent was P1, so P3 is rotation-correct. Pillar 2's headline items (Google
OAuth, email-only signup) remain human-blocked behind the frozen `/auth`.

## Scope (small)
- `src/lib/calculators.ts` — add a `costPerHour` field to `ShareCostRow`, computed in
  `estimateShareCosts` as `totalAnnual ÷ assumed annual hours` (the panel's already-
  disclosed 100 hrs/yr fuel assumption, lifted to a named constant so the per-hour and
  the operating line stay consistent).
- `src/components/ShareCostPanel.tsx` — render the per-hour figure for the selected
  ownership scenario in the featured card, with an honest one-line caveat that flying
  fewer hours raises it (fixed costs spread over fewer hours).
- `src/lib/calculators.test.ts` — add a worked-example assertion that
  `costPerHour === round(totalAnnual / 100)`.

## Acceptance criteria
- The aircraft listing detail page's Cost-to-own panel shows an "≈ $X / flight hour"
  figure for the selected ownership scenario (sole / 1/2 / 1/3 / 1/4), and it updates
  when a different scenario is selected.
- The figure equals `totalAnnual ÷ 100` for that scenario (the panel's stated 100 hrs/yr
  assumption) — no new fabricated input; uses only numbers already in the panel.
- An honest caveat states the per-hour is at 100 hrs/yr and rises if you fly fewer hours.
- `npx next build` + typecheck pass; the new unit test passes.
- QA smoke (HTTP 200 / no app console errors / no horizontal overflow at 1280 + 375)
  passes on the listing detail page; the panel still looks right.

## Out of scope
- No new table column (avoids mobile-overflow risk) — the per-hour lives in the
  featured scenario card only.
- No change to the cost assumptions, the share-split math, or any other module.
- No change to the standalone /tools/cost-calculator or the partnership CostCalculator.
- No schema / query / data-model changes.
