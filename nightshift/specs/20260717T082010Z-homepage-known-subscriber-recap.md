# homepage-known-subscriber-recap

## Goal
Give known alert subscribers a "since your last visit" recap module near the top of `/`, listing real new-match counts per remembered search — closing the last open item in Plan-pass batch #4.

## Scope
- `src/lib/alertLocalSubscriptions.ts` — add `readAndStampVisit()`, a once-per-page-load cache around the existing `getLastVisitAt`/`stampVisitNow` pair (needed so the new homepage module and `Nav`'s existing pill, which both mount on `/`, agree on the same "since" boundary instead of racing to re-stamp first).
- `src/components/Nav.tsx` — switch its own "N new" pill to `readAndStampVisit()` (behavior-preserving refactor).
- `src/lib/alertMatchCounts.ts` — export the existing `MAX_NEW_SINCE_PATHS` cap for reuse.
- `src/lib/alertEditCriteria.ts` — add `describeLocalAlertContext(sourcePath)`, reusing the existing `describeContext` phrasing to label a locally-remembered source_path (no DB row to read a context from for anonymous subscribers).
- `src/app/actions.ts` — add `getNewAlertMatchesBreakdownForPaths(sourcePaths, since)`, a per-path breakdown sibling to the existing `getNewAlertMatchesSinceForPaths` sum.
- `src/components/HomepageAlertRecap.tsx` (new) — known-subscriber-only client module.
- `src/app/page.tsx` — mount it between the hero and `FeaturedListings`.

## Acceptance criteria
- Anonymous visitors (and a subscriber's first-ever visit, with no prior last-visit stamp) see the homepage byte-identical — component renders `null`.
- A known subscriber (`isAlertSubscriber()` true) with ≥1 real new match since their last visit sees a module listing each matching remembered search with an honest count and a working link to that search, plus a link to `/alerts/manage`.
- Counts are real, live DB counts via `getAlertMatchCount(..., { since })` — never fabricated, never "since forever" (first-ever visit yields no stamp → no render).
- `Nav`'s existing "N new" pill and the new homepage module read the identical `since` boundary for one page load (no double-stamp race).
- No new capture point, no schema change, no new PostHog event.
- `npx tsc --noEmit` and `npx next build` both exit 0; QA smoke passes on `/` at desktop 1280 + mobile 375 with zero console errors/overflow.

## Out of scope
- Any change to the alert capture/subscribe flow itself.
- Styling/label refinement for legacy path-segment SEO source_paths (falls back to a generic "New listings" label).
- New analytics events for this module (it's a retention surface, not a capture point).
