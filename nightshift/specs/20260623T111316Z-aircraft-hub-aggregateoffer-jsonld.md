# aircraft-hub-aggregateoffer-jsonld

## Goal
Emit page-level `AggregateOffer` (price-range) JSON-LD on the `/aircraft` hub — priority
seed page #2 — so it has the same structured-data depth its make / make+model / state
sub-family pages already carry, exposing a real price range to Google (price-range rich
result eligibility) during the INDEXING stage.

## Scope (small, additive metadata only)
- `src/app/aircraft/page.tsx` — import `buildAircraftAggregateOfferJsonLd`, build it from the
  SAME `fetchAircraftPage(params)` listings already used for the ItemList block, and render
  the `<script type="application/ld+json">` right after the existing ItemList script.

## Acceptance criteria
- `npx next build` + typecheck pass green.
- The served `/aircraft` HTML contains an `AggregateOffer` JSON-LD block with `lowPrice`,
  `highPrice`, `offerCount`, and `priceCurrency: USD` (previously absent).
- The numbers are derived from the same listings the visible cards + ItemList use (no
  cloaking): same `fetchAircraftPage(params)` result, real `asking_price > 0` only.
- No visible change to the page (invisible head metadata only); page still renders the
  cream marketplace, filters, and cards correctly at desktop 1280 + mobile 375.
- qa-smoke exit 0 on `/aircraft` (HTTP 200, zero app-origin console errors, zero
  horizontal overflow at both viewports).

## Out of scope
- Any visible UI change, new component, or copy change.
- `/partnerships` (no clean numeric price aggregate — buy-in ≠ aircraft price).
- New page families (mission/budget pages) — separate larger [goal] items.
- Schema/DB/dependency changes.
