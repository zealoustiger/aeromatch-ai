# alert-edit-hidden-criteria

## Goal
On `/alerts/manage`'s inline Edit form, show any alert-criteria params that aren't
exposed as a form field (e.g. `min_year`, `max_tt`, `avionics`, `grade`, `q`, or a
partnership's `model`) as labeled, individually-removable chips, so a subscriber can
see and edit the *complete* set of criteria their alert matches on, not just the
subset the form's fixed fields cover.

## Scope
- `src/lib/alertEditCriteria.ts`: new exported `getHiddenCriteria(type, sourcePath)`
  → `{ key, label }[]`, computed as "every query param on `source_path` that isn't in
  the form-exposed set for that alert type," with a readable label per known key and
  an honest `"key: value"` fallback for anything unrecognized (never silently drops a
  real criterion). Extend `buildAlertCriteriaUpdate` with an optional `removeKeys?:
  string[]` param (strips those keys from the existing querystring before/independent
  of the exposed-field `set()` calls).
- `src/app/actions.ts`: new `removeAlertCriteriaParam(id, key, token?)` server action —
  same ownership proof as `updateAlertCriteria`, guards against removing a key that's
  actually one of the form-exposed fields (defense in depth), calls
  `buildAlertCriteriaUpdate` with the target's current (unchanged) exposed fields +
  `removeKeys: [key]`, updates `source_path`/`context`, revalidates.
- `src/components/AlertEditForm.tsx`: inside the open edit panel, render the hidden
  criteria (if any) as a row of chips below the visible fields, each with a ✕ that
  calls the new action and optimistically removes itself from local state.
- New unit tests: `src/lib/alertEditCriteria.test.ts` (new file) covering
  `getHiddenCriteria` (aircraft/partnership/seeker, known-key labels, unknown-key
  fallback, no-hidden-params → empty array) and `buildAlertCriteriaUpdate`'s new
  `removeKeys` behavior.

## Acceptance criteria
- An aircraft alert whose `source_path` carries `min_year`/`max_tt`/`avionics`/`grade`/
  `q` beyond the visible form fields shows one labeled chip per extra param when Edit
  is opened.
- A partnership alert with a `model` param (not exposed by the partnership edit form)
  shows a "model X" chip.
- Clicking a chip's ✕ removes just that param from the alert's `source_path`, leaves
  every other param (visible-field values + other hidden params) unchanged, and the
  chip disappears from the UI without a full page reload.
- An alert with no hidden params renders no chip row at all (no empty/awkward UI).
- `npx tsc --noEmit` and `npx next build` both exit 0; new unit tests pass; no schema
  change.
- `qa-smoke.mjs` on `/alerts/manage` (desktop 1280 + mobile 375): HTTP 200, zero
  app-origin console errors, zero horizontal overflow.

## Out of scope
- Editing a hidden param's *value* (only remove, not edit-in-place) — matches the
  backlog item's literal ask.
- The two open `[P1][want]` items (save-search auth-wall, collection-layout redesign)
  and the "near-instant" alerts P1 (see CHANGELOG for why deferred this cycle).
- Any change to `parseSourcePath` (the cron's own, separate parser) or to matching
  behavior — this is purely an edit-form visibility/removal UI, not a matching change.
