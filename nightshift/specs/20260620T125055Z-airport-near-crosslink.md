# Spec — airport→near crosslink (internal linking)

## Goal
Surface the new `/partnerships/near/[icao]` page family from each existing
`/airports/[icao]` page with one tasteful, inventory-gated internal link, so
crawlers and humans reach the new family and link equity flows to it.

## Lane
[goal] — internal-linking SEO lever. Follows up directly on the prior cycle
(partnerships-near-airport), whose "Next" list item #3 was exactly this crosslink.
Scoreboard at orient = 61 pageviews/7d.

## Scope (files expected to touch)
- `src/app/airports/[icao]/page.tsx` — add the gated link/card to the near page.
  (One file. No new components, no lib changes.)

## Approach
- Reuse the EXACT inventory check the near page + sitemap already use: call
  `getNearbyPartnerships(airport.icao)` and render the link only when
  `data && data.results.length >= MIN_NEARBY` (the same condition near/[icao]
  uses at line 49 before `notFound()`). Single source of truth — no forked
  threshold. This guarantees the link target resolves 200, never 404.
- Tasteful: one clear sky-blue link/card "Aircraft partnerships near {name} →"
  with the live nearby count, placed near the existing cross-link footer.
- The existing `/partnerships?airport={icao}&radius=50` "Search with filters →"
  link: leave it (it's a distinct, legitimate filtered-search affordance). ADD
  the canonical near-page link rather than swapping, to avoid scope creep/risk.

## Acceptance criteria
1. On an airport WITH nearby inventory (a near-page sitemap hub, e.g. KPAO), the
   `/airports/[icao]` page renders a link to `/partnerships/near/[icao]`, and that
   target returns 200.
2. On an airport WITHOUT inventory (e.g. KJFK / KAUS), the link is NOT rendered —
   no broken internal link.
3. The gate reuses `getNearbyPartnerships` + `MIN_NEARBY` from
   `src/lib/nearbyPartnerships.ts` (no second threshold).
4. `npx next build` green; `npx tsc --noEmit` shows only the 3 pre-existing
   `.test.ts` baseline errors — no new errors in touched files.
5. No console/hydration errors; no 375px horizontal overflow; sky-blue accent only.

## Out of scope
- No schema change, no SQL, no new lib/component files.
- No swap/removal of the existing filtered-search link.
- No change to the near page, sitemap, or any frozen file.
