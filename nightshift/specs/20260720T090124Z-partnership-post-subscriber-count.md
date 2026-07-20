# partnership-post-subscriber-count

## Goal
Show an honest "N subscribers with matching alerts will hear about this listing in
their next digest" line on the partnership post-success screen, closing the loop for
sellers by showcasing the alert system (GOAL.md tier-3 alert-experience `[goal]`,
BACKLOG.md `[P1][goal]` "N matching subscribers will be notified" on the post-success
screens).

## Scope
- New pure module `src/lib/alertSubscriberMatch.ts`: parses a partnership-relevant
  alert `source_path` (`/partnerships`, `/partnerships?...`, `/partnerships/near/[icao]`,
  `/partnerships/make/[slug]`, `/partnerships/state/[xx]`, or `/` for an "all" alert)
  into a match target, and a pure `matchesPartnershipListing` predicate that checks one
  partnership's make/model/state/home_airport against that target (mirrors the digest
  cron's `applyPartnershipModelFilter`/`ilike`/`eq` semantics, reversed to work on a
  single row instead of a query).
- Async wrapper `countMatchingPartnershipSubscribers(listing)` in the same file: fetches
  confirmed/active alerts (excluding the capture self-check email), evaluates the match
  predicate for each, returns the count — or `null` on any error (never a fabricated 0).
- Wire into `/partnerships/[id]/page.tsx`'s existing `justPosted` success block: when the
  count is `null` or `0`, render nothing new (no fabricated/zero line); when ≥1, add one
  line naming the real count.
- Unit tests for the pure parser + predicate (not the DB wrapper).

## Out of scope
- Aircraft `/aircraft/new` post-success screen (partnerships first, per the backlog
  item's own slice — natural follow-up).
- Seeker-listing post-success (seekers aren't matched by partnership-type alerts).
- Radius-based `/partnerships?airport=X&radius=Y` alerts are resolved via the existing
  `getAirportsWithinRadius` helper — no new airport logic.
- No new capture point, no schema change, no `alert_subscribed` wiring (this is a
  read-only count, not a new AlertSignup).

## Acceptance criteria
- `npx tsc --noEmit` and `npx next build` both exit 0.
- New unit tests pass covering: null/unrecognized path, bare `/partnerships`, `/` (all),
  `/partnerships?make=&model=&state=&airport=`, `/partnerships/make/[slug]`,
  `/partnerships/state/[xx]`, `/partnerships/near/[icao]`, comma multi-model, and a
  non-matching case for each dimension.
- `/partnerships/[id]?posted=1` renders the new line only when the real count is ≥1;
  renders nothing extra when the count is 0 or unavailable (error).
- QA smoke passes (HTTP 200, no console errors, no horizontal overflow) at 1280 + 375px
  for `/partnerships/[id]` and `/partnerships`.
- No prod DB writes; any test alert/partnership rows created for QA verification are
  deleted before the cycle ends.
