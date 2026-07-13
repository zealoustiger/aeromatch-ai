# alert-browse-matchcount

## Goal
Thread the real, honest live-match count into the browse-footer `AlertSignup` on `/aircraft`
and `/partnerships` so the two highest-traffic filter/search pages finally show the "N match
right now" expectation line, closing the last named gap from `alert-matchcount-rollout`.

## Scope
- `src/app/aircraft/page.tsx` — destructure `totalCount` (already returned by the
  `fetchAircraftPage(params, visitorCoords)` call the page already makes for its ItemList
  JSON-LD) and pass it as `matchCount` to the existing browse-footer `<AlertSignup source="browse_footer">`.
- `src/app/partnerships/page.tsx` — pass `itemListListings.length` (already fetched via the
  page's existing `getPartnershipListings(params)` call) as `matchCount` to the existing
  browse-footer `<AlertSignup source="browse_footer">`.
- No new query. No schema change. No new capture point (`alert_subscribed` already carries
  `match_count` from prior cycles' plumbing).

## Why this is honest
- `/aircraft`'s `fetchAircraftPage` total already accounts for EVERY active filter (make,
  model/modelPattern, state, min/max price, min/max year, min/max tt, grade, avionics, q,
  drops, airport/distance-sort RPC's own total) — it's the exact same total the page's own
  `AircraftSaleList` renders as "N aircraft for sale found". Using it as `matchCount` can never
  overstate what's shown. When `filters.drops` narrows results in JS (uncountable via SQL),
  `fetchAircraftPage` already returns `totalCount: null` — passed through as `undefined` so
  the box renders no count line rather than a wrong one (existing `hasMatchCount` honesty
  gate in `AlertSignup.tsx`, no new code needed there).
- `/partnerships` has no exact-count query today — `PartnershipList`'s own result line already
  reads `listings.length` off the same `.limit(50)`-capped `getPartnershipListings` call. Using
  that identical number for `matchCount` keeps the alert box consistent with what the page
  itself already claims; it never overstates (undercounts only past 50 real matches, the same
  pre-existing cap the visible result count already lives with).

## Acceptance criteria
- `/aircraft` with 0 active filters: browse-footer alert box reads "N aircraft match right now"
  where N equals the "N aircraft for sale found" count shown above the list.
- `/aircraft` filtered to a narrow slice (e.g. `?make=Cirrus&min_price=500000`): the alert box's
  count matches the filtered result count, not the unfiltered site total.
- `/aircraft?drops=1`: alert box renders with no count line (never a wrong number).
- `/partnerships` with 0 active filters: browse-footer alert box reads "N partnerships match
  right now" matching the visible result count.
- No change to the empty-state `AlertSignup` (`matchCount={0}`, already wired) on either page.
- `npx tsc --noEmit` and `npx next build` both clean; QA smoke passes on `/aircraft` and
  `/partnerships` at desktop 1280 + mobile 375 (HTTP 200, 0 console errors, 0 overflow).

## Out of scope
- Any change to `AlertSignup.tsx`, `alertMatchCounts.ts`, or the cron — this cycle only wires
  an existing return value through two page components.
- Adding real pagination/exact-count to the partnerships browse query (a bigger, separate slice).
- The other two open `[P1][goal]` items in refill #8 (partnership watch-buy-in-drop parity,
  live matches in the confirm email) — untouched this cycle.
