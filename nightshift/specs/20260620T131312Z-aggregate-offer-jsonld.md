# Spec — page-level AggregateOffer (price-range) JSON-LD on for-sale aggregation pages

## Goal
Make the three for-sale aggregation page families eligible for Google price-range
rich results by emitting a valid, real-data-only `AggregateOffer` (lowPrice /
highPrice / offerCount / priceCurrency) alongside the existing `ItemList` markup.

## Scope (small)
- `src/lib/aircraftJsonLd.ts` — add exported `buildAircraftAggregateOfferJsonLd(listings, {name, url})`.
- `src/lib/aircraftJsonLd.test.ts` — add unit tests mirroring existing style.
- `src/app/aircraft/[make]/page.tsx` — render the new node (reuse existing name/url).
- `src/app/aircraft/[make]/[model]/page.tsx` — same.
- `src/app/aircraft/[make]/[model]/[state]/page.tsx` — same.

## Acceptance criteria
1. New helper returns a `Product` whose `offers` is an `AggregateOffer` with
   numeric `lowPrice` (min asking_price), `highPrice` (max), `offerCount` (count
   of priced listings), `priceCurrency: 'USD'`, derived ONLY from listings with
   `typeof asking_price === 'number' && asking_price > 0`.
2. Returns `null` when fewer than 2 priced listings (zero or one) — never a
   fabricated or degenerate range.
3. Helper reuses the SAME `name`/`url` each page already passes to
   `buildAircraftItemListJsonLd` (no divergence / no cloaking).
4. The existing `ItemList` markup is unchanged and still emitted on all three pages.
5. Served production HTML for `/aircraft/cessna/172` contains both the ItemList
   AND a valid AggregateOffer whose numbers match the real listings; a family with
   <2 priced listings emits NO AggregateOffer.
6. No visual/UI change; no console/hydration errors at desktop + 375px; JSON-LD parses.

## Out of scope
- No schema/DB change, no SQL, no change to the `/aircraft/for-sale/[state]` page
  (task scopes the make / make+model / make+model+state families).
- No change to the existing ItemList builder behavior.
- No new visible content.
