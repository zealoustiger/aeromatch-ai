# similar-rails-snap-carousel

**Lane:** [want] (last non-bug cycle `partnership-hub-resource-links` pulled [goal]; last cycle PASS → no blocker → [want] owed per the 1:1).

## Goal
Convert the two in-listing "Similar" modules on the detail pages into horizontal
snap-carousels (hidden scrollbar + scroll-snap + desktop chevrons) using the existing
`RailScroller` + compact rail cards — the "real Option-B target" of the collection-layout
redesign — so "more like this" on a listing matches the homepage curated rails.

## Scope (small)
- `src/components/SimilarAircraft.tsx` — render its results through `RailScroller` with
  `AircraftRailCard` instead of a vertical `space-y-4` stack of full `AircraftSaleCard`s;
  fetch up to 12 (was 3) so the rail is worth scrolling.
- `src/components/SimilarListings.tsx` — render through `RailScroller` with
  `PartnershipRailCard` instead of a vertical stack of full `PartnershipCard`s; bump
  `MAX` 3 → 12.
- No other files. No data-layer signature changes beyond passing a larger limit.

## Acceptance criteria
- `/aircraft/listing/[id]` "Similar aircraft for sale" renders as a horizontal rail of
  compact `AircraftRailCard`s (hidden scrollbar, scroll-snap, desktop chevrons), each a
  crawlable internal link to its own detail page.
- `/partnerships/[id]` "Similar partnerships" renders as a horizontal rail of compact
  `PartnershipRailCard`s, same mechanics, each a crawlable internal link.
- Both modules still fail soft (render nothing) when there are no sensible matches.
- `npx next build` + typecheck pass.
- QA smoke (desktop 1280 + mobile 375) on one real `/aircraft/listing/[id]` and one real
  `/partnerships/[id]`: HTTP 200, zero app-origin console errors, **zero horizontal page
  overflow** (the rail scrolls internally, mirroring `HomeRails`), and the screenshots show
  the rail laid out correctly.

## Out of scope
- The "Newest partnerships" homepage row (`FeaturedListings`) — leave to a follow-up
  cycle (note in CHANGELOG Next); it's a separate homepage section, not an in-listing rail.
- Any change to ranking/matching logic, card contents, or data queries beyond the limit.
- Wholesale Option-A category-tile mosaic redesign (awaits the human's mock).
