# estimate-spread-position

## Goal
On the ClubHanger Estimate panel, tell the buyer **where this listing sits within the
low–high spread** of comparable same-family asking prices (e.g. "priced above 70% of
them") — turning the static range shipped last cycle into a real position signal.

## Scope (small)
- `src/lib/aircraftEstimate.ts` — add a `percentile` field to `ClubHangerEstimate`
  (share of the OTHER comps priced strictly below this listing, whole percent;
  0 = cheapest, ~100 = priciest). Compute once from the already-sorted `others`
  array; set it in both return branches. No new query, no new DB read.
- `src/app/aircraft/listing/[id]/page.tsx` — in `EstimatePanel`, append a short honest
  position clause to the existing range caption (only in the range branch where
  `high > low`).
- `src/lib/aircraftEstimate.test.ts` — assert `percentile` on existing worked examples.

## Acceptance criteria
- `clubHangerEstimate` returns a whole-number `percentile` = round(#others priced
  strictly below subject / #others × 100), in BOTH the dead-band (`around`) and
  `below`/`above` branches.
- A below-market subject reads a low percentile; an above-market subject reads a high
  percentile (verified by tests on the existing 300k–380k comp set).
- The EstimatePanel range caption shows the position in plain language: cheapest →
  "priced below all of them", priciest → "priced above all of them", otherwise
  "priced above N% of them". Only renders when a real spread exists (`high > low`);
  the degenerate single-value-spread fallback caption is unchanged.
- No fabrication: percentile is computed only from the real OTHER-comp prices already
  used for median/low/high; honesty floor (`MIN_ESTIMATE_COMPS`) unchanged.
- `npx next build` + `tsc --noEmit` clean; `node --test aircraftEstimate.test.ts` green;
  QA smoke exit 0 on the listing page at 1280 + 375.

## Out of scope
- The Deal Check (similar-year/hours) verdict — untouched.
- Any new query, column, or comp-set change. Partnership pages.
- Changing the honesty floors, dead-band, or the median/range math.
