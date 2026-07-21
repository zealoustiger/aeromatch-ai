# alert-avionics-grade-q-edit

## Goal
Make an aircraft alert's avionics, listing-quality (grade), and keyword (`q`) criteria — today invisible on `/alerts/manage`'s Edit/Duplicate forms — visible and editable, closing the last two open `[P2][goal]` items in BACKLOG's alert-experience section.

## Scope
- `src/lib/alertEditCriteria.ts` — extend `EditableAlertTarget`'s `aircraft` variant + `AlertCriteriaFields` with `avionics`/`grade`/`q`; parse them in `parseEditableAlertTarget` (grade resolves the legacy `min_grade` floor too, mirroring `parseGradeFilter`); write them in `buildAlertCriteriaUpdate` (new `cleanAvionics`/`cleanGrade` validators; explicitly drop the legacy `min_grade` key once this form has touched grade); carry them through `computeWidenCandidate`'s aircraft branch and `targetToFields`; add all three to `EXPOSED_KEYS.aircraft` (plus `min_grade`) so they stop appearing as "hidden criteria" chips.
- `src/components/AlertEditForm.tsx` / `src/components/NewAlertForm.tsx` — add an Avionics checkbox group (reusing `AVIONICS_FILTER_OPTIONS`, same pattern as `AircraftSaleFilters`), a Grade (A/B/C) checkbox group, and a Keyword text input, in the aircraft-only branch of both forms.
- `src/lib/alertOverlap.test.ts` — update the local `aircraft()` test-target helper for the 3 new required fields.

## Acceptance criteria
- An aircraft alert whose `source_path` carries `avionics=glass,waas`, `grade=A,B`, and/or `q=low+time` shows those as pre-filled, editable UI (checkboxes / text input) in both Edit and Duplicate — not hidden-criteria chips.
- Editing any of the 3 fields and saving updates `source_path` (and the alert's `context` sentence) correctly; unchecking every avionics/grade box or clearing the keyword drops that param entirely.
- A legacy `min_grade=B` alert pre-fills Grade A+B checked; saving through the form rewrites it to the modern `grade=A,B` param and drops `min_grade`.
- Creating a brand-new alert via `NewAlertForm` with avionics/grade/keyword set produces the same correctly-shaped `source_path`.
- No new capture point, no schema change; `npx tsc --noEmit` and `npx next build` stay clean; existing alert test suites (`alertOverlap.test.ts`, `alertSubscriberMatch.test.ts`) stay green.

## Out of scope
- Any change to the alert-matching/digest-cron logic (it already independently parses `avionics`/`grade`/`q`/`min_grade` off the raw `source_path` — this slice is UI-only).
- The remaining `[P2][goal]` accessibility pass on alert capture + manage flows (separate backlog item).
