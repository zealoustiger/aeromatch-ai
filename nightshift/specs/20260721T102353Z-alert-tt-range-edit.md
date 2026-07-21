# alert-tt-range-edit

## Goal
Expose `min_tt`/`max_tt` (total-time hours) as editable Min/Max fields in the aircraft
alert Edit and Duplicate forms, so a "Cessna 182 under 4,000 hours" alert survives edit
and duplicate instead of only showing as a removable-only hidden chip.

## Scope
- `src/lib/alertEditCriteria.ts`: add `minTt`/`maxTt` to `EditableAlertTarget` (aircraft
  variant) and `AlertCriteriaFields`; parse `min_tt`/`max_tt` in
  `parseEditableAlertTarget`; write them in `buildAlertCriteriaUpdate` (reuse a
  `cleanTt`-style positive-int cleaner, same shape as `cleanYear`); add `min_tt`/`max_tt`
  to `EXPOSED_KEYS.aircraft`; include in `targetToFields`; thread into
  `computeWidenCandidate`'s aircraft branch (carry-through, not cleared).
- `src/components/AlertEditForm.tsx`: add Min/Max TT (hours) number inputs to the
  aircraft branch, alongside the existing Min/Max year fields; wire into local state,
  `openEdit`, the live-count-preview effect's deps/fields, and `handleSubmit`'s fields.
- `src/components/NewAlertForm.tsx`: same Min/Max TT fields + state threading for the
  aircraft branch (`InitialValues`, `reset`, `handleSubmit`'s fields).
- `src/lib/alertOverlap.test.ts`: extend the `aircraft()` test helper's `Partial<>` type
  with `minTt`/`maxTt` (mirrors the year-range precedent's one-line test-helper change).

## Acceptance criteria
- An aircraft alert whose `source_path` carries `min_tt`/`max_tt` shows those values
  pre-filled as Min/Max TT (hours) fields on Edit, not as a hidden chip.
- Editing and saving changes to those fields updates `source_path` correctly (verified
  via the live match-count preview reacting, and/or a direct `buildAlertCriteriaUpdate`
  check).
- Duplicate carries `min_tt`/`max_tt` into the new alert's prefilled form via
  `targetToFields`.
- `getHiddenCriteria` no longer reports `min_tt`/`max_tt` as hidden once exposed.
- `next build` + typecheck pass; `node --test` on `alertOverlap.test.ts` (and any other
  affected unit test) passes.
- QA smoke (`qa-smoke.mjs`) passes on `/alerts/manage` at desktop 1280 + mobile 375, no
  console errors, no horizontal overflow.

## Out of scope
- Avionics / grade / `q` exposure (separate backlog items).
- Any change to the digest cron's `parseSourcePath` (intentionally separate, per this
  file's own header note).
- Accessibility pass (separate backlog item).
