# Spec — home-deals-rail

## Goal
Add a "Priced below market" curated rail to the homepage that surfaces the
same below-market aircraft deals as `/aircraft/deals`, so the homepage (priority
seed page #1, highest traffic) gives buyers an at-a-glance reason to dig in — the
Redfin "hot homes" loop. This is the explicitly-queued **slice 1** of the
`[P2][want] "Great Deals" view + homepage rail` item (the `/aircraft/deals`
destination shipped last cycle and exported `fetchUnderMarketDeals()` for exactly
this).

## Scope (small, additive)
- `src/components/AircraftRailCard.tsx` — add an optional `discountPct?: number`
  prop; when present, render a small emerald "~X% below average" pill over the
  photo (top-left). No change to default rendering.
- `src/components/DealsRail.tsx` (new) — server component: calls
  `fetchUnderMarketDeals()`, drops itself if fewer than `MIN_PER_RAIL` (4) deals,
  else renders one rail (RailScroller + AircraftRailCard with the discount pill),
  title links to `/aircraft/deals`. Mirrors `HomeRails` styling.
- `src/app/page.tsx` — render `<DealsRail />` right after `<HomeRails />`.

## Acceptance criteria
- Homepage shows a "Priced below market" rail of real for-sale listings, each
  card carrying an emerald "~X% below average" pill matching the deals page.
- The rail title + "See all" link to `/aircraft/deals`; each card links to its
  internal `/aircraft/listing/[id]` page.
- The rail self-drops cleanly (renders nothing) if there are fewer than 4 deals —
  no thin/empty rail, no fabricated cards.
- `npx next build` + typecheck pass.
- QA smoke on `/` exit 0 at desktop 1280 + mobile 375 (HTTP 200, zero app-origin
  console errors, zero horizontal page overflow); screenshots look right.
- No Core Web Vitals / layout regression vs the existing rails.

## Out of scope
- No change to `fetchUnderMarketDeals()` comp math or the `/aircraft/deals` page.
- No new DB query beyond the existing deals helper; no schema change.
- No redesign of the other homepage rails; the wholesale Option-A mosaic still
  awaits the human's mock.
