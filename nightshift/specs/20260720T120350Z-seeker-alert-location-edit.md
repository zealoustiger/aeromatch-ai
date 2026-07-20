# seeker-alert-location-edit

## Goal
Let a subscriber edit (not just remove) the state/home-airport that a "pilot-seeking-a-
partnership" (`seeker`) alert is scoped to, on `/alerts/manage`, closing an edit-parity gap
with what capture (`/partnerships/seeking?...&state=..&airport=..`) already creates.

## Context
The digest cron (`alert-digest/route.ts`) already matches seeker alerts on `state`/`icao`
(home-airport). But `alertEditCriteria.ts`'s `EditableAlertTarget` for `type: 'seeker'` only
carries `make`/`model` — `state`/`airport` on a seeker's `source_path` fall into
"hidden criteria" (removable-only chips from the `alert-edit-hidden-criteria` cycle), so a
subscriber who wants to *change* (not delete) their location filter has to delete and
recreate the whole alert.

## Scope
- `src/lib/alertEditCriteria.ts`: add `state`/`airport` to the `seeker` `EditableAlertTarget`
  variant; parse them off `/partnerships/seeking?...` in `parseEditableAlertTarget`; write
  them back in `buildAlertCriteriaUpdate`; carry them in `targetToFields`; add `state`/
  `airport` to `EXPOSED_KEYS.seeker` (so they stop rendering as hidden-criteria chips); add
  a location clause to the seeker branch of `describeContext` (mirrors partnership's
  `near {airport}` / `in {stateName}`) so the alert row's summary line reflects the real
  filter.
- `src/components/AlertEditForm.tsx`: show the existing State `<select>` and Home-airport
  `<input>` for seeker alerts too (currently gated to non-seeker / partnership-only); include
  `state`/`airport` in the seeker branch of the live-match-count preview and `handleSubmit`.
- `src/components/NewAlertForm.tsx`: same two field-visibility tweaks, so the "Duplicate"
  button (which prefills from `targetToFields`) doesn't silently drop a seeker alert's
  state/airport when creating the copy.

## Out of scope
- `computeWidenCandidate`'s seeker branch (still only drops `model`) — the widen-suggestion
  cascade to location is a separate, smaller follow-up, not required for edit parity.
- No schema change — reuses existing `state`/`airport` query params already understood by
  the digest cron and `alertMatchCounts.ts`'s live-count preview.
- No new capture point / no new `alert_subscribed` source.

## Acceptance criteria
- A seeker alert's `source_path` carrying `state=CA` and/or `airport=KHWD` shows those as
  editable State/Home-airport fields on `/alerts/manage`'s Edit form (not as hidden chips).
- Changing State/Home-airport and saving updates `source_path` correctly and the row's
  displayed context text reflects the new location.
- The live "N pilots match right now" preview in the edit form updates when State/Home-
  airport change.
- Duplicating a location-scoped seeker alert carries the state/airport into the new alert.
- `npx next build` + `tsc --noEmit` clean; QA smoke on `/alerts/manage` (desktop 1280 +
  mobile 375) passes with zero console errors / zero horizontal overflow.
