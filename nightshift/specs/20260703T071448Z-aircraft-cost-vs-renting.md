# aircraft-cost-vs-renting

## Goal
Add the "save $X/yr vs. renting" honest comparison — already live on partnership listings — to the aircraft-for-sale `ShareCostPanel`, so buyers see the same buy-vs-rent signal on both listing types.

## Scope
- `src/components/ShareCostPanel.tsx` — add a `REFERENCE_RENTAL_RATE` constant (150, matching `PartnerShareCostPanel.tsx`) and, under the existing "Featured scenario" block, a callout: "Save $X/yr vs. renting at $150/hr" (emerald, when the selected share's `totalAnnual` is cheaper than renting `ASSUMED_HOURS_PER_YEAR` hrs/yr at the reference rate) plus a buy-in break-even line ("The $Y buy-in recouped in ≈ N yrs at this rate"), mirroring `PartnerShareCostPanel.tsx` lines 130-149. When renting would be cheaper, show the honest inverse note instead (mirroring the `else` branch there) rather than hiding the module.
- No changes to `src/lib/calculators.ts` (all data — `totalAnnual`, `buyInPerShare`, `ASSUMED_HOURS_PER_YEAR` — already computed/exported) or to `page.tsx` (no new props needed; the panel already receives `rows`).
- No schema change, no new query.

## Acceptance criteria
- On an aircraft listing detail page with `asking_price` set, the Cost-to-own panel shows a "Save $X/yr vs. renting at $150/hr" line (or the honest inverse "renting would be cheaper" line) for whichever share option is selected, updating live when the share toggle changes.
- The buy-in break-even line only renders when annual savings vs. renting is positive (matches partnership panel's honesty gate — no divide-by-zero/negative-year math).
- Figures use only already-computed `ShareCostRow` fields (`totalAnnual`, `buyInPerShare`) and the existing `ASSUMED_HOURS_PER_YEAR` constant — no fabricated numbers, no new server queries.
- `npx next build` and `tsc --noEmit` pass clean.
- QA smoke (desktop 1280 + mobile 375) passes on at least 2 aircraft listing detail pages with an asking price; screenshots confirm the new callout renders without overflow or overlap with the existing table/links below it.
- No change to partnership pages, no change to listings without `asking_price` (panel already self-suppresses via the `p.asking_price ?` guard in `page.tsx`).

## Out of scope
- No hours/yr toggle on `ShareCostPanel` (unlike the partnership panel) — keep using the existing fixed `ASSUMED_HOURS_PER_YEAR` (100) to avoid widening this cycle's scope.
- No changes to the standalone `/tools/cost-calculator` page.
- No change to `REFERENCE_RENTAL_RATE` methodology or value (reuse 150, the same reference already shown to users on partnership pages, for consistency).
