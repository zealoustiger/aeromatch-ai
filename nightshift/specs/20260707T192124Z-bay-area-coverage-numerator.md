# Bay Area coverage benchmark — slice 1 (numerator only)

## Goal
Add a read-only admin readout of our own live Bay-Area inventory (partnerships +
aircraft-for-sale) as the first slice of the `[P1][want]` "Bay-Area coverage benchmark"
backlog item — a repeatable number we can track week over week, honestly scoped to what
we can compute today (no external denominator yet).

## Scope
- `src/lib/parseListing.ts` — export the existing `BAY_AREA_AIRPORTS` constant (currently
  private) so it can be reused as the canonical Bay Area ICAO list.
- New `src/lib/bayAreaCoverage.ts` — `getBayAreaCoverageSnapshot()`: counts active
  partnerships with `home_airport` in the Bay Area ICAO list (exact match), and active
  $50k+ aircraft-for-sale rows (excluding parts/wanted titles, matching the existing
  `SITEMAP_PRICE_FLOOR`/`PARTS_TITLE_PATTERNS` convention) whose free-text `location`
  matches a Bay Area city/airport keyword (approximate — `aircraft_for_sale` has no ICAO
  column).
- New `src/app/admin/coverage/page.tsx` — admin-gated page rendering the two counts plus
  an explicit note that no coverage % is shown (no honest denominator yet).
- `src/components/AdminTabs.tsx` — add a "Bay Area Coverage" tab.

## Acceptance criteria
- `/admin/coverage` renders for a signed-in admin with two real counts pulled from the DB
  (no fabricated numbers).
- Signed-out / non-admin visitors see the existing "Admin only" gate (unchanged behavior).
- No coverage percentage or denominator claim anywhere on the page (honesty gate — we
  don't have real market-size data yet).
- `npx next build` + typecheck pass.
- QA smoke (HTTP 200, no console errors, no horizontal overflow at 1280 + 375) passes on
  `/admin/coverage` (gated view, since QA has no admin session).
- No schema change, no new dependency, no FREEZE-listed file touched.

## Out of scope
- Denominator / actual coverage % (needs FAA fleet data or a competitor-listing count —
  next slice).
- Trade-A-Plane ingestion (separate backlog item).
- Any UI on the public site.
