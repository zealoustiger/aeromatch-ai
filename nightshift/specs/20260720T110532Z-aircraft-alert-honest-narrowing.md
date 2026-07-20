# aircraft-alert-honest-narrowing

## Goal
Close the seller-count overcount flagged in BACKLOG.md's plan-pass batch #13: the aircraft
post-success "N subscribers with matching alerts will hear about this listing" line
currently ignores an alert's `q`/`grade`/`min_grade`/`avionics`/`deal=good` refinements, so
it can OVERCOUNT (e.g. an alert scoped to "glass-panel Cessnas" counts against a steam-gauge
listing the digest cron would never actually email).

## Scope
- `src/lib/alertSubscriberMatch.ts` — extend `AircraftSubscriberTarget`/`AircraftListingFields`
  with `keyword`/`grades`/`dealOnly`/`avionics`(+`quality_score`/`title`/`description`/`id`/
  `smoh`), parse them off the bare `/aircraft?...` shape (mirroring the digest cron's
  `resolveTarget`) and the universal `deal=good` override (mirrors the cron's post-resolve
  patch), and honor them in `matchesAircraftListing` — `keyword`/`grades` evaluated
  synchronously against the listing's own fields; `dealOnly`/`avionics` taken as
  caller-injected verdicts (`isGoodDeal`/`avionicsOk`) since they need either a real DB comp
  query (`filterToGoodDeals`) or the real classifier (`avionicsMatch`), neither of which this
  file can import (see its header comment on why it stays a zero-non-trivial-import module).
- `src/lib/alertMatchCounts.ts` — `countMatchingAircraftSubscribers` now lazily (memoized,
  at most once) calls `filterToGoodDeals` when a live alert has `dealOnly`, and calls
  `avionicsMatch` per-alert when a live alert has `avionics`, passing both verdicts into
  `matchesAircraftListing`.
- `src/app/aircraft/listing/[id]/page.tsx` — pass the listing's `id`/`smoh`/`title`/
  `description`/`quality_score`/`avionics` into `countMatchingAircraftSubscribers` (all
  already read off the same `p` row the page already fetches).
- `src/lib/alertSubscriberMatch.test.ts` — new unit tests for keyword/grade/avionics/dealOnly
  matching + the new query-string parsing (incl. the universal `deal=good` override).

## Acceptance criteria
- Unit tests cover: keyword substring match (title OR description, case-insensitive),
  grade-band matching against `quality_score` (empty/all-three = no restriction, null score
  never fabricates a match), avionics/dealOnly fail-closed when the caller hasn't resolved a
  verdict yet, and `deal=good` riding on every recognized aircraft source_path shape.
- `npx tsc --noEmit` and `rm -rf .next && npx next build` both exit 0.
- Full unit suite (`node --experimental-strip-types --test 'src/**/*.test.ts'`) passes with
  no regressions.
- QA smoke (`qa-smoke.mjs`) passes on `/aircraft/listing/[id]` (a real listing, `?posted=1`)
  at desktop 1280 + mobile 375: HTTP 200, zero app-origin console errors, zero horizontal
  overflow.
- No new capture point, no schema/DB change — this only tightens an existing honesty gate
  on an already-live line.

## Out of scope
- The `LISTING_GRADE_FLOOR` env-based site-wide grade-floor clipping the real digest query
  applies (`gradeQueryPlan`) — this reverse-match uses the raw grade cutoffs, which is a
  documented, narrow discrepancy only on a non-default (unused today) floor setting.
- Any new alert capture point, digest/cron behavior change, or seeker/partnership reverse-
  match changes (this slice is aircraft-only, matching the backlog item).
