# Spec — Geo "partnerships near [airport]" pages: `/partnerships/near/[icao]` (slice 1)

UTC: 2026-06-20T12:38Z · Branch: `night/partnerships-near-airport` (off `staging`) · Lane: **[goal]**

## Goal
Ship a new quality, indexable programmatic page family at `/partnerships/near/[icao]`
that lists active aircraft partnerships within ~100 nm great-circle of a given airport,
ordered by distance — targeting the top "near [airport] / near me" geo search demand
(BACKLOG `[P1][goal]` geo item, slice 1). Each page is unique, real-data-backed, and
404s when there is no real nearby inventory (no thin/doorway pages).

## Data shape (CONFIRMED via read-only inspection of the production DB)
- `partnerships.home_airport` is an **ICAO string** (e.g. `KPAO`). 23 active partnerships;
  9 distinct home airports.
- The `airports` table has **16,885 rows** with `icao, iata, name, city, state, lat, lng, elevation`.
  All 23 partnership home airports resolve in it (so coords come from the airport record,
  matching the existing `/airports/[icao]` convention — partnerships' own lat/lng is mostly NULL).
- Resolving each partnership's coords via its `home_airport` and counting within 100 nm:
  - Bay Area hubs (KPAO, KHWD, KSQL, KLVK, KRHV, KOAK) → **20 nearby each** (dense real inventory).
  - KAUS / KADS / KFXE → 1 nearby (themselves only). KJFK/KLAX/KORD/KSEA/PHNL → **0 nearby**.
- Existing helper `haversineNm()` lives in `src/lib/airports.ts` (reuse the formula).

## Scope (small)
- NEW `src/app/partnerships/near/[icao]/page.tsx` — the page + `generateMetadata`.
- NEW `src/lib/nearbyPartnerships.ts` — pure-ish helper: given an airport, fetch active
  partnerships, resolve each one's coords via its home airport, compute distance, filter
  to ≤ radius, sort by distance ASC. Returns `{ airport, results: {p, distanceNm}[] }`.
  Also exports `getNearAirportSitemapIcaos()` for the sitemap (the single source of truth
  for which ICAOs are inventory-backed) and a shared `NEAR_RADIUS_NM = 100` / `MIN_NEARBY = 2`.
- EDIT `src/app/sitemap.ts` — emit `/partnerships/near/{icao}` ONLY for airports with
  `>= MIN_NEARBY (2)` real nearby partnerships (the Bay Area hubs), reusing the helper.

## Acceptance criteria (QA grades against these)
1. `/partnerships/near/kpao` returns **200**, shows the airport name/city, an H1, and the
   nearby partnership cards (reusing `PartnershipCard`), each with a distance ("X nm away";
   0 nm for based-here). Ordered by distance ASC.
2. A no-inventory airport (e.g. `/partnerships/near/kjfk`, `/partnerships/near/klax`) and a
   nonexistent ICAO (`/partnerships/near/zzzz`) both return **404** (`notFound()`) — never a
   thin/empty page. This is the make-or-break guardrail.
3. Unique `generateMetadata`: `<title>` = "Aircraft partnerships near {name} ({ICAO}) | ClubHanger",
   unique meta description, `alternates.canonical` → `${SITE_URL}/partnerships/near/{icao-lower}`,
   OpenGraph title/description. Verified in the SERVED production HTML.
4. JSON-LD: BreadcrumbList + an ItemList/CollectionPage of the nearby partnerships
   (reusing `buildPartnershipItemListJsonLd`), matching the visible cards 1:1.
5. Internal links: breadcrumb (Home / Partnerships / near {ICAO}); link to `/airports/{icao}`
   and to `/partnerships/state/{state}` for the airport's state.
6. `/sitemap.xml` includes `/partnerships/near/{icao}` for the inventory-backed hubs only
   (>=2 nearby) and NOT for empty/thin airports (no KJFK/KLAX).
7. `next build` + `tsc --noEmit` green (only the 3 pre-existing `.test.ts` baseline errors).
   QA on the PRODUCTION build (`next start`): no console/hydration errors; no horizontal
   overflow at 375px; sky-blue accent only.

## Out of scope
- `/aircraft/near/[icao]` (for-sale variant) — slice 2.
- "Near me" geolocation routing — slice 3.
- Any schema change, SQL, ranking change, or touching auth/admin/ingest/frozen files.
- Pagination (≤50 results is plenty for current inventory).
