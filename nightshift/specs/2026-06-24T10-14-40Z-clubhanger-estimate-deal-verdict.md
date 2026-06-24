# ClubHanger Estimate — similar-year + similar-hours "deal verdict"

**Lane:** `[want]` (last non-bug cycle `compare-pairs-expansion` pulled `[goal]`; last
cycle PASS, so no blocker → `[want]` owed per the 1:1). Item: the flagship
`[P1][want]` "ClubHanger Estimate — fair-value pricing (Zestimate analog)" — its
remaining slice is the **endorsement-style "Good deal / Priced high" verdict**, which
the backlog explicitly gates on *"once comps are narrowed to year-band + hours (then a
value judgement is honest)."* This cycle delivers exactly that, **additively**.

## Goal
On the internal listing detail page, add an honest **"good deal / fair / priced high"**
verdict that compares this aircraft's asking price only to **similar-year, similar-hours**
listings of the same make+model — controlling for the two biggest value drivers (year,
total time) that the existing whole-family ClubHanger Estimate explicitly cannot.

## Scope (small, additive, reversible)
- `src/lib/aircraftEstimate.ts` — new **pure, self-contained** helper
  `clubHangerDealVerdict(subject, comps)` + exported band/threshold constants. No imports,
  unit-testable like the existing `clubHangerEstimate`.
- `src/lib/aircraftEstimate.test.ts` — worked-example tests for the new helper.
- `src/lib/aircraftForSale.ts` — new read-only `getFamilyComps(make, modelPattern,
  notModelPattern, excludeId)` returning `{ asking_price, year, ttaf }[]` for active priced
  family listings, **excluding the subject listing by id**. Mirrors `getFamilyAskingPrices`
  (same family filter); read-only, **no schema change**, returns `[]` on any failure.
- `src/app/aircraft/listing/[id]/page.tsx` — compute the verdict (only when the listing has
  a real price AND a year AND ttaf AND a resolved family) and render it as an **additional,
  clearly-labeled line inside the existing `EstimatePanel`** (new optional prop). The
  existing whole-family comparison is unchanged.

## Acceptance criteria
- [ ] `npx next build` compiles and `npx tsc --noEmit` is clean in all touched files.
- [ ] New unit tests pass (`node --experimental-strip-types --test src/lib/aircraftEstimate.test.ts`),
      covering: good-deal, fair (dead-band), priced-high, insufficient narrowed comps → null,
      missing year/ttaf → null, and that out-of-band (year/hours) comps are excluded.
- [ ] Verdict renders on a real `/aircraft/listing/[id]` when enough similar-year +
      similar-hours comps exist; the wording is an honest value judgement that names the
      comp basis ("vs similar-year, similar-hours {family}") and states the comp count.
- [ ] Self-suppresses (no deal line, existing panel intact) when comps are thin, the
      listing lacks a year/ttaf/price, or the family is unknown — never a fabricated verdict.
- [ ] QA smoke exits 0 on `/aircraft/listing/[id]` (and `/aircraft`) at desktop 1280 +
      mobile 375 — HTTP 200, zero app-origin console errors, zero horizontal overflow — and
      the screenshots show the verdict rendering cleanly.

## Honesty guardrails (GOAL.md)
- A value judgement is published **only** when the comp set is narrowed to
  similar year (±YEAR_BAND) **and** similar hours (band), with **≥ MIN_DEAL_COMPS** such
  comps; otherwise nothing renders (no endorsement on thin/whole-family data).
- A ±dead-band around the narrowed median reads "Fair price" rather than inventing a small
  percentage. Dollars/percentages are whole numbers (no false precision).
- Phrased as an estimate from current asking prices, not an appraisal or an offer.

## Out of scope
- No change to the existing whole-family ClubHanger Estimate math or the per-card pill.
- No verdict chip on browse cards / similar-aircraft cards this cycle (detail page only).
- No schema/DB change, no new dependency, no new route.
