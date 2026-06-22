# Listing-Quality multi-select on /aircraft

**Lane:** `[want]` — Marketplace filters: multi-select + ranges (P1, "Filters & search").
Last non-bug cycle (make-faq) was `[goal]`, so `[want]` is owed. This is the **final
remaining slice** of that P1 item (ranges shipped 2026-06-21T23:35Z; Model multi-select
shipped 2026-06-21T23:58Z).

## Goal
Let a pilot filter Planes-for-Sale by **any combination of listing-quality grades A / B / C**
(e.g. "A and B together"), instead of the current single grade *floor* select.

## Scope (small, additive)
- `src/components/AircraftSaleFilters.tsx` — replace the single "Listing quality"
  `<select>` (floor: All / B+ / A) with a 3-checkbox group (A / B / C, any combo),
  writing a comma-joined `grade` URL param. Mirrors the existing Model multi-select.
- `src/components/AircraftSaleList.tsx` — `fetchAircraftPage` parses `filters.grade`
  into a set of selected grades and builds an OR of per-grade `quality_score` bands
  (A ≥78, 50≤B<78, C<50), each clipped to the site-wide `FLOOR_GRADE`. Back-compat:
  an old single `min_grade` floor (A/B) expands to "that grade and up".
- `src/lib/seo.ts` — `describeAircraftFilters` mentions the selected grades so the
  save-search / email-alert text reads naturally.

The mobile drawer reuses `AircraftSaleFilters`, and `page.tsx` threads `params`
generically, so the mobile drawer + pager + Clear-all inherit it.

## Acceptance criteria
1. The Model... no — the **Listing quality** filter on `/aircraft` is a checkbox group of
   A / B / C (desktop sidebar + mobile drawer); ticking shows "· N selected".
2. Selecting **A + C** returns the union of grade-A and grade-C listings and **excludes
   grade B** (count A+C == count A + count C; B-only listings absent).
3. Selecting a single grade returns exactly that grade's band (e.g. B only = 50–77 score).
4. Selecting all three (or none) == "All listings" (no quality narrowing beyond the site floor).
5. The `grade` selection survives in the URL (shareable / pageable / saved / Clear-all clears it),
   and the save-search/alert text reflects it.
6. `next build` + `tsc` green; QA smoke exit 0 (HTTP 200, no console/hydration errors,
   no horizontal overflow) at desktop 1280 + mobile 375; screenshots look right.

## Out of scope
- No change to the grade cutoffs, the `quality_score` SQL column, or the site `FLOOR_GRADE`.
- No new param semantics beyond `grade` (legacy `min_grade` still honored read-only).
- No partnerships-side quality filter; no removable active-filter chips (possible follow-up).
- NO schema/DB/SQL, no new component/color/dependency.
