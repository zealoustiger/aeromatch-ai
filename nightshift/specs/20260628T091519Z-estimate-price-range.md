# estimate-price-range — show the comparable-listings price RANGE in the ClubHanger Estimate

**Pillar:** 3 (proprietary buyer analysis). Rotation: last 3 cycles were Pillar 2
(desktop-contact-intent-restore), Pillar 1 (nnumber-make-fallback), Pillar 3
(partnership-comp-magnitude). Last 1–2 cycles were Pillar 2 + Pillar 1 → rotate to Pillar 3.

## Goal
Make the ClubHanger Estimate answer "what do comparable planes actually cost?" by
publishing the **low–high asking-price range** of the same comp set alongside the median —
a genuine market-position signal Controller/Barnstormers/Trade-A-Plane don't synthesize.

## Why this slice
The Estimate currently publishes only the **median** of the OTHER same-family priced comps.
The comps-module doc (`aircraftComps.ts`, `priceStats`) explicitly says a price **RANGE** is
"far more useful" than a single median. The range is honest (real min/max of the exact comp
set already used for median/compCount), proprietary (synthesized from our data), and needs
**no new query** — the `others` array is already computed and sorted in `clubHangerEstimate`.

## Scope (small, additive)
- `src/lib/aircraftEstimate.ts` — add `low` and `high` (whole-dollar min/max of the OTHER
  comps) to the `ClubHangerEstimate` interface and to BOTH return paths. `others` is already
  sorted ascending → `others[0]` / `others[others.length - 1]`. Pure, no new imports.
- `src/app/aircraft/listing/[id]/page.tsx` — `EstimatePanel`: render the range in the
  existing "Based on the median…" caption, e.g. "Comparable {family} listings range
  $low–$high (median $median) across N for sale now." Suppress the range only when low == high
  (degenerate single-value spread) to avoid a "$X–$X" non-range.
- `src/lib/aircraftEstimate.test.ts` — extend existing cases to assert `low`/`high`.

## Acceptance criteria
- [ ] `ClubHangerEstimate` carries `low`/`high`; both return branches (around + below/above)
      set them to the true min/max of the OTHER comp set (not including the subject twice).
- [ ] EstimatePanel shows the range with the median; reads naturally; no "$X–$X" when low==high.
- [ ] Honesty preserved: same MIN_ESTIMATE_COMPS gate, no fabricated numbers, whole dollars.
- [ ] `npx next build` + typecheck pass; `node --test` on aircraftEstimate.test.ts passes.
- [ ] QA smoke (desktop 1280 + mobile 375) exit 0 on an aircraft listing page; screenshots
      show the range rendering cleanly with no overflow.

## Out of scope
- Partnership detail page (separate comp model) — aircraft listing only this cycle.
- Changing the verdict math, dead-band, or comp gates.
- The Deal Check (similar-year/hours) module — unchanged.
