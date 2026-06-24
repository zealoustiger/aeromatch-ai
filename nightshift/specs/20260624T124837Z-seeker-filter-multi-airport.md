# Spec — seeker-filter-multi-airport

**Lane:** `[want]` (last non-bug cycle `guide-flying-club-vs-co-ownership` pulled `[goal]` → alternate to `[want]`). No blocker (last cycle PASS). STAGE=INDEXING; pageviews 325/7d at orient (PostHog secondary; GSC not configured).

## Goal
Let pilots filter the **Pilots-Seeking** browse page (`/partnerships/seeking`) by **more than one home airport at once**, mirroring the already-shipped multi-airport chip input on the `/partnerships` filter — so an owner near several fields (e.g. KHWD, KOAK, KCCR) can see seekers based at any of them together.

## Scope (small, mirrors the proven partnership pattern)
- `src/components/SeekerFilters.tsx` — replace the single "Near Home Airport" text input with the multi-airport chip input (type a code → Enter/comma/blur adds a removable chip), reusing the exact pattern from `PartnershipFilters`. Keep the existing radius dropdown, shown only when **exactly one** airport is selected (radius around several airports is ambiguous).
- `src/lib/seekersQuery.ts` — add `airports?` to `SeekerFilters`; include it in `anySeekerFilter`; resolve the airport list from `airports` (multi) with a fallback to the legacy `airport`+`radius` pair. Radius still expands a **lone** airport via `getAirportsWithinRadius`; multiple airports are OR'd as-is (`.in('home_airport', codes)`). Mock path handled too.
- `src/components/SeekerActiveFilterChips.tsx` — render one removable chip per `airports` code (removing one rewrites `airports` without it); keep the legacy single `airport`(+radius) chip as a back-compat fallback. Mirrors `PartnershipActiveFilterChips`.
- `src/app/partnerships/seeking/page.tsx` — count `airports` in `activeFilterCount` (so the mobile drawer badge is right).

## Acceptance criteria
- On `/partnerships/seeking`, the Home-Airport field accepts multiple ICAO codes as removable chips; entered airports are OR'd in the results (a seeker based at ANY chosen airport shows).
- `?airports=KHWD,KOAK` returns seekers based at either airport; one removable chip per airport appears above the results, removing one keeps the rest.
- Legacy `?airport=KAUS` and `?airport=KAUS&radius=50` still work (single chip; radius expands the lone airport) — no regression for old links / saved searches.
- The radius dropdown only renders when exactly one airport is selected.
- `npx next build` + typecheck green; QA smoke exit 0 on `/partnerships/seeking` and `/partnerships/seeking?airports=KHWD,KOAK` at desktop 1280 + mobile 375 (HTTP 200, zero app-origin console errors, zero horizontal overflow); screenshots look right.

## Out of scope
- No schema/DB change (pure front-end + query-param wiring over the existing `home_airport` column).
- Not changing make/rating/hours/share filters (left exactly as the recent `seeker-filter-rework` shipped them).
- No "drive-time" conversion or the seeking *form*'s multiple-base-airports field (separate queued slices).
