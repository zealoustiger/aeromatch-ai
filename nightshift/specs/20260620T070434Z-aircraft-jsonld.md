# aircraft-jsonld — ItemList/Product JSON-LD on the aircraft for-sale SEO pages

## Goal
Make the two new high-intent aircraft-for-sale list pages eligible for Google
rich results by marking up the listings they show with Schema.org `ItemList`
JSON-LD (each item a `Product` with an `Offer`), using REAL listing data only.

## Lane / scoreboard
Lane `[goal]` (SEO). Scoreboard at orient = 54 (scoreboard prints 60 pageviews/7d).
Prior non-bug cycle was `[want]` (trust-nudges) → this cycle correctly pulls `[goal]`.

## Scope (small)
- NEW `src/lib/aircraftJsonLd.ts` — pure builder turning `AircraftForSale[]` into an
  `ItemList` of `Product`/`Offer` JSON-LD. Real fields only; omit anything missing.
- EDIT `src/components/AircraftSaleList.tsx` — extract + export a `fetchAircraftPage(filters)`
  that returns the same first-page listings the component renders (DRY: the component
  now calls it, no behavior change), so the pages can mark up exactly what's visible.
- EDIT `src/app/aircraft/[make]/[model]/page.tsx` — inject the ItemList `<script type="application/ld+json">`.
- EDIT `src/app/aircraft/for-sale/[state]/page.tsx` — same.
- NEW `src/lib/aircraftJsonLd.test.ts` — unit tests for the builder (honesty: no fake fields).

## Acceptance criteria
1. Both `/aircraft/[make]/[model]` and `/aircraft/for-sale/[state]` emit a valid
   `application/ld+json` `<script>` whose JSON parses, with `@context=https://schema.org`
   and `@type=ItemList`.
2. The ItemList items correspond to the listings actually shown on the page (same
   first page, same filters/order) — each an `ItemListItem`→`Product` with `name`
   matching the visible card title and `url` = the listing's real `source_url`.
3. Listings with a numeric `asking_price` get a `Product.offers` `Offer` with
   `price`, `priceCurrency: "USD"`, `availability: https://schema.org/InStock`, and
   `url`. Listings with NO numeric price get NO offer (no fabricated price).
4. NO `aggregateRating`/`review` anywhere (no real review data exists). No fabricated
   image (the card photo is an explicit "Not actual plane photo" placeholder → omit `image`).
5. `name`/`description` consistent with the visible H1/content (no cloaking).
6. `npx next build` + `npx tsc --noEmit` pass; QA against the PRODUCTION build
   (`npm run start`) parses both JSON-LD blocks and confirms 1–5; /browse at desktop
   + 375px shows NO visual regression and no console/hydration errors.

## Out of scope (DEFER → CHANGELOG Next:)
- Airport-page schema; FAQPage on guides; JSON-LD on partnership state/make pages.
- No DB/schema change (additive only). No edit to auth/admin/env/frozen files.
- Vehicle-specific props beyond Product (kept to Product/Offer for safety this slice).
