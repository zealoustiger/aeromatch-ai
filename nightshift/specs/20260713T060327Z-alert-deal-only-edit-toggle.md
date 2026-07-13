# Deal-only toggle on `/alerts/manage`'s edit form

## Goal
Let a subscriber flip an existing aircraft alert's "only good deals" flag from the
`/alerts/manage` inline Edit form, instead of it being capture-time-only (delete + re-subscribe).

## Scope
- `src/lib/alertEditCriteria.ts` — extend the `aircraft` `EditableAlertTarget`/`AlertCriteriaFields`
  shape with `dealOnly: boolean`; parse the existing `deal=good` query param in
  `parseEditableAlertTarget`; set/clear it in `buildAlertCriteriaUpdate`.
- `src/lib/seo.ts` — `describeAircraftFilters` gains a "good deals only" clause when
  `params.deal === 'good'`, so the row's `context` summary (rebuilt via `describeContext`)
  reflects the flag after a save.
- `src/components/AlertEditForm.tsx` — add a "Only show good deals" checkbox to the aircraft
  branch of the edit form, seeded from `target.dealOnly` on open, included in the submitted
  fields.
- No schema change (the flag already lives in `source_path`'s query string, same as
  make/model/price). No new capture point — this is management-surface parity only.

## Acceptance criteria
- Opening Edit on an aircraft alert whose `source_path` already has `deal=good` shows the
  checkbox pre-checked.
- Checking the box and saving appends `deal=good` to the alert's `source_path`; the row's
  criteria summary (`context`) now includes "good deals only".
- Unchecking an already-deal-only alert and saving removes `deal=good` from `source_path` and
  drops the clause from `context`.
- Partnership and seeker edit forms are unaffected (checkbox only renders for `type === 'aircraft'`).
- `npx next build` + typecheck pass; QA smoke passes on `/alerts/manage` at desktop 1280 + mobile 375
  with zero app-origin console errors and zero horizontal overflow.
- `describeAircraftFilters`'s existing callers (`/aircraft` page's capture-time context) are
  unaffected when no `deal` param is present.

## Out of scope
- Any change to the capture-time `AlertSignup` deal-only checkbox (already shipped).
- The alert-digest cron's `deal=good` matching logic (already reads it; untouched).
- Snooze / pause-until and model-level `/saved` alert scoping — separate open backlog items.
