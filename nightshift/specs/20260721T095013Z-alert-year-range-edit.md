# Expose Year range as editable fields in aircraft alert Edit/Duplicate

## Goal
Aircraft alert Edit/Duplicate on `/alerts/manage` should let a subscriber see and adjust
`min_year`/`max_year`, the same way they already can for price range — instead of it being
a removable-only hidden chip that Duplicate silently drops.

## Scope
- `src/lib/alertEditCriteria.ts`: add `minYear`/`maxYear` to the aircraft `EditableAlertTarget`
  variant + `AlertCriteriaFields`; parse `min_year`/`max_year` in `parseEditableAlertTarget`;
  write them in `buildAlertCriteriaUpdate` (mirror `cleanPrice`'s validation shape); add
  `min_year`/`max_year` to `EXPOSED_KEYS.aircraft`; carry them through `targetToFields` and
  `computeWidenCandidate`'s aircraft fields objects (so widening never silently drops a year
  bound it didn't intend to touch).
- `src/components/AlertEditForm.tsx`: Min/Max year inputs in the aircraft branch, wired into
  state, `openEdit` seeding, the live-match-count preview, and `handleSubmit`.
- `src/components/NewAlertForm.tsx`: same two fields so Duplicate (which prefills via
  `targetToFields`) carries the year bound into the new alert instead of dropping it.

## Out of scope
- The cron route's `parseSourcePath` (`src/app/api/cron/alert-digest/route.ts`) — untouched,
  per this file's standing precedent (separate parser, no shared import).
- Other remaining hidden aircraft criteria (`min_tt`/`max_tt`, `grade`, `avionics`, `q`) —
  later sibling slices, not this cycle.
- Partnership/seeker radius exposure (the sibling P2 item) — separate slice.

## Acceptance criteria
- An aircraft alert whose `source_path` carries `min_year`/`max_year` shows them as prefilled
  Min/Max year inputs (not a hidden "2015 or newer" chip) when its Edit form opens.
- Editing either field and saving updates `source_path` with the new `min_year`/`max_year`
  (or removes the key when cleared), and the alert's `context` regenerates correctly
  (`describeAircraftFilters` already knows this param — confirmed via code read).
- Duplicating an aircraft alert that has a year bound carries it into the new alert's
  prefilled form (not silently dropped).
- The live "N listings match right now" preview updates as Min/Max year change.
- `npx tsc --noEmit` and `npx next build` stay clean; no schema change.
- QA: `/alerts/manage` smoke-passes at desktop 1280 + mobile 375, zero console errors, zero
  horizontal overflow. Visual cycle (new form fields) — screenshots must look correct too.
