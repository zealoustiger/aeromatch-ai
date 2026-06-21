# Spec — aircraft-filter-ranges

**Lane:** [P1][want] — Marketplace filters: multi-select + ranges (Filters & search).
This cycle ships the **ranges** slice; model/quality multi-select are later slices.

## Goal
Turn the three single-bound numeric filters on `/aircraft` (Max Price, Year-min,
Max Total Time) into proper **min↔max ranges** so a pilot can search e.g. "Cessna
172, $80k–$150k, 1998–2010, under 3000 hrs" — closing the biggest gap in the P1
Filter UI overhaul.

## Scope (small, additive)
- `src/components/AircraftSaleFilters.tsx` — render a min/max input pair for each of
  Price, Year, Total Time (keep the existing params, add the missing bound). Add the
  new keys to `SECONDARY_KEYS` so an active range auto-opens "More filters".
- `src/components/AircraftSaleList.tsx` — add `min_price` / `max_year` / `min_tt` to
  the `Filters` interface and three matching query clauses (`gte asking_price`,
  `lte year`, `gte ttaf`). Existing `max_price`/`min_year`/`max_tt` unchanged.
- `src/lib/seo.ts` — make `describeAircraftFilters` range-aware (used by the
  Save-search + email-alert context) so the description stays accurate.

The mobile drawer reuses `AircraftSaleFilters`, and `page.tsx` passes `params`
through generically (so `pageHref`, alert context, etc. pick the new params up for
free) — no other files need touching.

## Acceptance criteria
1. Price, Year, and Total Time each render as a **min and max** pair in the desktop
   sidebar and the mobile drawer; entering a value updates the matching URL param
   (`min_price`/`max_price`, `min_year`/`max_year`, `min_tt`/`max_tt`).
2. The list query honors all six bounds: a min+max price range returns only
   listings whose `asking_price` is within `[min_price, max_price]`; year range on
   `year`; total-time range on `ttaf`. Existing single-bound behavior unchanged.
3. Active range filters persist across pagination (pager hrefs carry them) and the
   "Clear all filters" button clears them.
4. Save-search / alert context text reflects ranges (e.g. "$80,000–$150,000",
   "2000–2010", "under 3,000 hours") instead of dropping a bound.
5. `npx next build` + `tsc --noEmit` green (no new errors vs the 4 pre-existing
   `.test.ts` baseline). QA smoke PASS at desktop 1280 + mobile 375 — HTTP 200,
   zero app-origin console errors, zero horizontal overflow; sidebar looks right.

## Out of scope
- Model multi-select and Listing-Quality multi-select (later slices of this item).
- Any DB/schema change, new column, or new dependency.
- Restyling the filter panel beyond the min/max layout; chip bar untouched.
