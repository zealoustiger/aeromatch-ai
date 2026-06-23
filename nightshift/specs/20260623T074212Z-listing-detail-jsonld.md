# Spec — Product/Offer + breadcrumb structured data on `/aircraft/listing/[id]`

## Goal
Make the brand-new internal aircraft-listing detail family (`/aircraft/listing/[id]`,
shipped + sitemapped this week) machine-understandable to Google by adding valid
`Product`/`Offer` JSON-LD and a crawlable `BreadcrumbList` trail — a textbook
INDEXING-stage SEO win on pages that currently emit **no structured data at all**.

## Lane
`[goal]` — last non-bug cycle (`listing-cost-and-price-history`) pulled `[want]`; last
cycle PASS so no blocker; so `[goal]` is owed per the 1:1. STAGE=INDEXING → structured
data + internal linking on a just-indexable family is the right lever.

## Scope (small, additive)
- `src/lib/aircraftJsonLd.ts` — add `buildAircraftListingJsonLd(p, { url, image })`
  returning a single self-contained `Product` (+ `Offer` when a real numeric price
  exists, + real `image`/`brand`/`sku` only when present). Honesty rules identical to
  the existing builders (no fabricated price/rating/review/image).
- `src/lib/aircraftJsonLd.test.ts` — add unit tests for the new builder.
- `src/app/aircraft/listing/[id]/page.tsx` — emit the `Product` JSON-LD `<script>`, and
  replace the single "Back to Planes for Sale" link with the shared `Breadcrumbs`
  component (Home › Planes for Sale › {Make Model family} › this listing) — which adds a
  crawlable internal-link trail **and** `BreadcrumbList` JSON-LD for free.

## Acceptance criteria
- `/aircraft/listing/[id]` for a priced listing emits a `Product` JSON-LD with `name`,
  `url` (canonical detail URL), `brand`, and an `Offer` (price, USD, InStock,
  UsedCondition).
- A no-price listing emits the `Product` but **no** `offers` (never an invented price).
- `image` appears in the markup **only** when the listing has a genuine harvested photo
  (`pickRealPhoto` non-null and not a placeholder); otherwise omitted (no site-logo
  stand-in, no `aggregateRating`/`review`).
- A `BreadcrumbList` is present and its visible trail links back to `/aircraft` and the
  make+model family page; back-navigation is preserved.
- `npx next build` + typecheck pass; `node --test` for `aircraftJsonLd.test.ts` passes.
- QA smoke (desktop 1280 + mobile 375) on the detail page: HTTP 200, zero app-origin
  console errors, zero horizontal overflow; screenshots look right.

## Out of scope
- Vehicle-specific schema beyond `Product`/`Offer`; `additionalProperty` spec rows.
- Any change to the list-page (`/aircraft/[make]/[model]`) markup.
- Similar-listings (slice 3) and homepage-rail wiring (other slice-4 halves).
- Visual/content changes beyond swapping the back-link for the breadcrumb trail.
