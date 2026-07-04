# seeker-additional-airport-clear-fix

## Goal
Fix a data-integrity bug on the seeker (pilot-seeking-partnership) edit form: blanking
the "Also flying from" second-airport field doesn't clear it — the old value silently
survives — because `updateSeekerListing` only includes `additional_airports` in the
update payload when a new value is present.

## Scope
- `src/app/actions.ts` — `updateSeekerListing` only. Change the payload construction so
  `additional_airports` (null or `[code]`) is always included in the update payload,
  and fix the migration-fallback retry condition (currently gated on the *value* being
  truthy, which would also skip retrying when clearing on an unmigrated DB) to trigger
  on the error message alone.
- No schema change (the `additional_airports` column/migration already exists as a
  documented pending human step — this fix is orthogonal to whether it's applied yet).
- No UI change, no new route, no new query.

## Acceptance criteria
- A seeker listing with `additional_airports = ['KSQL']` that is edited with the
  "Also flying from" field blanked ends up with `additional_airports = null` after save
  (once the column exists — verify the *update call* now sends `additional_airports: null`
  rather than omitting the key).
- Setting a new/different second airport on edit still works exactly as before (no
  regression to the existing set path).
- On a DB where the `additional_airports` column is not yet migrated, the update still
  succeeds via the existing graceful-fallback retry (no user-facing crash), for both the
  "setting" and "clearing" cases.
- `npx next build` + typecheck pass.
- QA smoke passes on `/partnerships/seeking/[id]/edit` (and `/partnerships/seeking/new`
  untouched) at desktop 1280 + mobile 375: HTTP 200, zero console errors, zero
  horizontal overflow.

## Out of scope
- The runner-up finding (`image_is_placeholder` not reset to `true` when all photos are
  removed on partnership edit) — noted in BACKLOG for a future cycle.
- Any change to `createSeekerListing` (insert path) — its conditional-key behavior is
  fine for inserts since omitting vs. sending `null` on create is equivalent.
- Any change to the `additional_airports` migration itself.
