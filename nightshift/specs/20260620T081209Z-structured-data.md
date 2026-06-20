# Spec — Extend Schema.org JSON-LD to airport + partnership-family pages

Lane: [goal] · Scoreboard at orient: 54 (scoreboard prints 60 pageviews/7d)

## Goal
Make three high-page-count programmatic families eligible for Google rich results by
adding valid, REAL-DATA-ONLY Schema.org JSON-LD: an Airport/Place node on
`/airports/[icao]`, and an ItemList of the partnership listings shown on
`/partnerships/state/[state]` and `/partnerships/make/[make]` (mirroring the
existing aircraft ItemList pattern).

## Scope (files expected to touch)
- NEW `src/lib/partnershipJsonLd.ts` — shared helpers:
  - `buildPartnershipItemListJsonLd(listings, { name, url })` → ItemList of
    Product nodes, each linking to a real `/partnerships/[id]` URL. Mirrors
    `aircraftJsonLd.ts` (real data only; Offer only when a numeric buy-in exists).
  - `buildAirportJsonLd(airport)` → `Place` with `additionalType` Airport, using
    only fields the page already shows (name, ICAO/IATA, city/region, lat/lng,
    elevation).
- NEW `src/lib/partnershipsQuery.ts` (or extend an existing lib) — extract the
  exact PartnershipList fetch+trust-sort+limit into a shared
  `getPartnershipListings(filters)` so the page-level ItemList markup is built from
  the SAME result set the page visibly renders (no cloaking / no divergence).
- EDIT `src/components/PartnershipList.tsx` — call the shared query helper (no
  behavior change to the rendered list).
- EDIT `src/app/airports/[icao]/page.tsx` — inject Airport Place JSON-LD + (when
  listings exist) an ItemList of the at-airport + nearby partnerships shown.
- EDIT `src/app/partnerships/state/[state]/page.tsx` — fetch the same listings
  `PartnershipList` shows and inject an ItemList; pass them down to avoid a double
  fetch where reasonable.
- EDIT `src/app/partnerships/make/[make]/page.tsx` — same ItemList treatment.

## Acceptance criteria
1. `npx next build` green + `npx tsc --noEmit` shows no NEW errors (only the 3
   pre-existing `.test.ts` import-extension errors remain).
2. `/airports/<real icao>` emits an `application/ld+json` block that JSON-parses,
   with `@context=https://schema.org`, `@type=Place`, `additionalType` Airport, and
   real `iataCode`/identifier + `geo` lat/lng matching the page's airport. No
   fabricated fields (no rating/review). `name` matches the visible airport name.
3. `/partnerships/state/<state>` and `/partnerships/make/<make>` each emit an
   `application/ld+json` ItemList that JSON-parses; its items match the listings
   visibly rendered on the page, each `item.url` is a real `/partnerships/[id]` that
   returns HTTP 200.
4. No fabricated review/rating/aggregateRating anywhere; an Offer appears only when
   a listing has a real numeric buy-in price.
5. QA against the PRODUCTION build (`npm run start`): all three pages load at
   desktop + 375px with no console / hydration errors and no visual regression.

## Out of scope
- No DB/schema change. No new pages/routes. No metadata/copy rewrites.
- No changes to the aircraft JSON-LD already shipped.
- No aggregateRating / review markup (honesty rule).
- No restyle of the airport/state/make pages beyond the invisible script tag.
