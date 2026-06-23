# home-newest-partnerships-rail

## Goal
Convert the homepage "Newest partnerships" row from a static 6-card grid into the same
horizontal snap-carousel (`RailScroller`) the homepage curated rails and the in-listing
"Similar" rails already use, for a consistent, swipeable homepage.

## Scope
- `src/components/FeaturedListings.tsx` only.
  - Wrap the cards in `RailScroller` (hidden scrollbar + scroll-snap + desktop chevrons).
  - Keep the richer `FeaturedListingCard` (real photo + share-type badge) — no card downgrade.
  - Bump `getLatestPartnerships(6)` → `getLatestPartnerships(12)` so there's more to browse
    (parity with the 12-card curated/similar rails).

## Acceptance criteria
- Homepage `/` renders the "Newest partnerships" section as a horizontal rail that swipes on
  mobile and shows left/right chevrons on desktop hover (left hidden until scrolled, right
  hidden once fully scrolled) — visually/behaviourally matching "Browse curated collections".
- Each card still links to `/partnerships/[id]` and shows the same price / aircraft / location /
  share-type info as before (no card content regression; real photos still shown when present).
- The "View all" link(s) still present and working.
- `npx next build` + typecheck pass; QA smoke on `/` exits 0 at desktop 1280 + mobile 375
  (HTTP 200, zero app-origin console errors, **zero horizontal PAGE overflow** — the rail
  scrolls internally like the other rails).
- Section disappears cleanly when there are zero partnerships (existing `length === 0` guard).

## Out of scope
- No change to `FeaturedListingCard`, `PartnershipRailCard`, `RailScroller`, or any other page.
- No new data source, query change beyond the limit, or schema change.
- The wholesale Option-A category-tile mosaic / tabbed Option-C redesign (awaits human mock).
