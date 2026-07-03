# aircraft-share-cost-hours-toggle

## Goal
Add the hours/yr toggle to the aircraft-for-sale detail page's "Cost to own" panel
(`ShareCostPanel`) so it matches the partnership detail page's `PartnerShareCostPanel`,
which already lets a buyer flip between 50/75/100/150 hrs/yr instead of being locked to
a single hardcoded 100 hrs/yr assumption.

## Scope
- `src/lib/calculators.ts` — give `estimateShareCosts()` an optional third
  `hoursPerYear` parameter (default `ASSUMED_HOURS_PER_YEAR` = 100), used in place of
  the hardcoded constant for `operatingAnnual` and `costPerHour`. Existing 2-arg call
  sites (incl. `calculators.test.ts`) keep their current behavior unchanged.
- `src/components/ShareCostPanel.tsx` — accept raw `askingPrice` + `engineReservePerYear`
  instead of pre-computed `rows`; add local `hrsPerYear` state (50/75/100/150, default
  100, same options/pill-button pattern as `PartnerShareCostPanel`); recompute rows via
  `estimateShareCosts` client-side (`useMemo`) whenever the toggle changes; update the
  "at 100 hrs/yr" copy to reference the selected value instead of the constant.
- `src/app/aircraft/listing/[id]/page.tsx` — update the `ShareCostPanel` call site to
  pass `askingPrice`/`engineReservePerYear` instead of the pre-computed `shareCosts` rows.

## Acceptance criteria
- On `/aircraft/listing/[id]` (a listing with an asking price), the Cost to own panel
  shows four hours/yr pill buttons (50/75/100/150 hrs/yr), defaulting to 100 selected.
- Clicking a different hours/yr option recomputes the featured scenario, the per-hour
  cost, the rent-vs-buy comparison, and the all-scenarios table — without a page reload.
- The share-count toggle (sole/½/⅓/¼) still works exactly as before, independent of the
  hours/yr toggle.
- `estimateShareCosts(askingPrice, reserve)` (2-arg call, no hours override) still
  returns byte-identical numbers to before this change — existing unit tests pass
  unmodified.
- `npx tsc --noEmit` and `npx next build` both pass clean.
- No console errors, no horizontal overflow at desktop 1280 or mobile 375 on
  `/aircraft/listing/[id]`.

## Out of scope
- Any change to `PartnerShareCostPanel` (it already has this toggle).
- Any change to the engine-reserve calculation itself, or to the reference rental rate.
- Persisting the selected hours/yr choice anywhere (localStorage, URL) — resets on reload,
  same as the partnership panel's behavior today.
