# alert-radius-edit

## Goal
Expose the radius selector (miles around a single home airport) as an editable field
in the partnership/seeker alert Edit and Duplicate (New alert) forms on `/alerts/manage`,
so `radius` — already match-honored by the digest cron — stops being an invisible
"hidden criterion" the user can only remove, never adjust.

## Scope
- `src/lib/alertEditCriteria.ts`: add `radius: string` to the `partnership`/`seeker`
  `EditableAlertTarget` variants + `AlertCriteriaFields`; parse it in
  `parseEditableAlertTarget` (only when exactly 1 airport code, mirroring
  `SeekerFilters`/`PartnershipFilters`' own rule); write it in
  `buildAlertCriteriaUpdate` (new `cleanRadius` validator, dropped whenever the airport
  count isn't exactly 1); round-trip it in `targetToFields`; add `radius`/`airport`/
  `airports` to `EXPOSED_KEYS.partnership`/`.seeker` so it's no longer a hidden chip.
- `src/components/AlertEditForm.tsx`: new radius `<select>` (reusing the same 5 options
  as the browse filter UI), rendered only when exactly 1 airport chip is selected, for
  partnership/seeker targets. Wire into the live-count preview + submit fields.
- `src/components/NewAlertForm.tsx`: same select for the Duplicate/"+ New alert" flow.
- **Bonus bug fix (found while touching `computeWidenCandidate`):** the seeker branch's
  model-drop widen candidate (`fields: { make: target.make, model: '' }`) omits
  `state`/`airports` entirely, so `buildAlertCriteriaUpdate` silently clears them too —
  a seeker alert with model+state (or model+airport) set gets a widen suggestion that's
  far broader than its "Show all {make} pilots" description claims (an honesty-gate
  violation per GOAL.md). Fix: carry `state`/`airports`/`radius` through unchanged,
  mirroring the aircraft branch's identical model-drop step, which already preserves
  every other field.

## Acceptance criteria
- Opening Edit on a partnership or seeker alert whose `source_path` has `airports=<one
  code>&radius=<n>` shows the radius select prefilled to `<n> mi`; with 0 or 2+ airports
  it's not shown.
- Changing the radius and saving updates the alert's `source_path` (`radius=` param) and
  the live match-count preview reacts to it.
- Duplicating that alert prefills the same radius in the New alert form; submitting
  creates a new alert with the same `radius=` param.
- Clearing to 0 airports or adding a 2nd airport drops `radius` from the saved
  `source_path` (existing invariant, unchanged).
- `radius` no longer appears under "Also applies (from advanced search)" for
  partnership/seeker alerts (it's now a first-class field, not a hidden chip).
- `npx tsc --noEmit` and `npx next build` both clean; existing `alertOverlap.test.ts` /
  any standalone `alertEditCriteria` verification script still pass with the added field.

## Out of scope
- No change to the aircraft alert type (no airport/radius concept there).
- No change to `SeekerFilters.tsx`/`PartnershipFilters.tsx`/`HeroSearch.tsx` (the browse
  filter UIs already have their own radius selects — this only extends the ALERT edit
  surface). No shared extraction of the `RADIUS` options array (existing convention:
  duplicated locally, same as `HeroSearch`/`SeekerFilters` today).
- No change to the alert-digest cron's matching logic (`radius` is already honored
  there — this is a management-surface visibility fix, not a new capture point).
