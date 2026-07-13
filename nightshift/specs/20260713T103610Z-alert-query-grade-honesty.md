# Spec: alert-query-grade-honesty

## Goal
Close the rest of the aircraft-alert honesty gap (BACKLOG.md `[P1][goal]` "Honor-or-strip
`q` / `grade` / `avionics`"): honor the free-text search (`q`) and listing-quality (`grade`/
`min_grade`) filters in the alert digest cron + live match-count helper (both currently
silently drop them, matching the wider unfiltered set), and strip the one filter too
expensive to honor safely this cycle (`avionics`) from what a captured alert actually
promises, so no alert claims a filter it won't apply.

## Scope
- `src/lib/listingQuality.ts` — extract the grade-band query-plan helpers
  (`parseGradeFilter`, `gradeQueryPlan`, `floorScore`, `GRADE_BANDS`) out of
  `AircraftSaleList.tsx` into this shared lib (pure functions, already imported there from
  here) so the cron + match-count helper can reuse the exact same grade semantics instead of
  a third hand-rolled copy.
- `src/components/AircraftSaleList.tsx` — import the extracted helpers instead of defining
  them locally; no behavior change on the browse page.
- `src/lib/alertMatchCounts.ts` — add `keyword`/`grades` to the aircraft `AlertTarget`, parse
  `q`/`grade`/`min_grade` off the bare `/aircraft?...` source_path, apply both in
  `countActiveAircraft` and `previewAircraft` (the two aircraft filter-application sites).
- `src/app/api/cron/alert-digest/route.ts` — same addition to its aircraft `AlertTarget`,
  `resolveTarget`'s bare-path branch, `applyAircraftFilters`, and the duplicated
  non-deal-only filter block in `countNewAircraft` (the two aircraft filter-application
  sites there).
- `src/app/aircraft/page.tsx` — exclude `avionics` from the query string persisted into
  `alertSourcePath` (the one filter param not honored this cycle), so an alert captured with
  an active avionics filter doesn't silently promise a check that never happens. No copy
  change needed — `describeAircraftFilters` never mentioned avionics in the promise text.

## Acceptance criteria
- An alert's live match count (`/alerts/manage`, `getAlertMatchCount`) and the digest cron's
  new-listing count both shrink correctly when the source alert's `q` or `grade`/`min_grade`
  param would exclude a listing that matches on every other field.
- `previewAircraft`'s sample listings also respect `q`/`grade` (used by "Send sample" and the
  confirm-page preview).
- Setting an avionics filter on `/aircraft` then subscribing no longer writes `avionics=...`
  into the alert's `source_path`; the other active filters are unaffected.
- `AircraftSaleList.tsx`'s own grade filtering on `/aircraft` is unchanged (byte-identical
  query plan, now sourced from the shared helper).
- `npx tsc --noEmit` and `npx next build` both pass.
- QA smoke on `/aircraft` (desktop 1280 + mobile 375): HTTP 200, no new console errors, no
  horizontal overflow. This is a non-visual/data-logic cycle — screenshots saved for the
  audit trail but not read.

## Out of scope
- Honoring `avionics` in the alert matching logic (needs a paginated full-table
  fetch+classify duplicated in two more files — a real next slice, not this one).
- Any change to `/alerts/manage`, `/alerts/status`, or email copy.
- Migrating/scrubbing `avionics` params off alerts already captured before this fix.
