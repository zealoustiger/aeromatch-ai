# Spec — Aircraft true match count (filter overhaul, follow-up polish)

**UTC:** 2026-06-19T08:03Z
**Slug:** aircraft-true-match-count
**Branch:** night/aircraft-true-match-count

## Goal
Show the **true total number of matching listings** in the `/aircraft` results
header instead of capping at "60+", so applying a filter visibly changes the
count even when matches exceed the 60-row display window.

## Background
`AircraftSaleList` fetches with `.limit(60)` and prints `listings.length`, so the
header reads "60 aircraft for sale+ found" for any result set ≥ 60. With 1856
active listings, the default page and most filters all read "60+", making the
Max Total Time / Make / Model filters look broken above 60 matches. The prior
cycle (2026-06-19T07:03Z) explicitly flagged this as the next step.

## Scope
- `src/components/AircraftSaleList.tsx` (one file).
  - Add `{ count: 'exact' }` to the Supabase select to get the true total
    matching the active filters in the same query.
  - Display that count exactly (no "+"), with correct singular/plural.
  - When the true count exceeds the rows shown, add a small "Showing first 60"
    clarifier so the page stays honest about the display cap.

## Acceptance criteria
1. Default `/aircraft` header reads "**1856 aircraft for sale found**" (exact
   live DB count), not "60+".
2. `/aircraft?max_tt=2000` header reads "**418 aircraft for sale found**" (exact)
   — proving total-time filtering works above the 60-row window.
3. `/aircraft?max_tt=100` reads "56", `?max_tt=50` reads "42" (both ≤ 60, still
   exact and unchanged from before).
4. When the total exceeds the displayed rows, a "Showing first 60" note appears;
   when total ≤ rows shown, it does not.
5. The "Price drops only" (`?drops=1`) path keeps its existing JS-narrowed count
   (count: 'exact' can't express the column-to-column price comparison) — no
   regression: it still shows the genuine-drops count.
6. `npx next build` passes (compile + typecheck). No new console errors on the
   page. Renders cleanly at 375px.

## Out of scope
- Pagination / "load more" (still showing max 60 rows — only the *count* changes).
- The missing-photos P1 (overlaps in-flight human scraper WIP — left untouched).
- Avionics / SMOH filters (DB columns 0% populated — ingest gap).
- Any change to filter inputs, sorting, or the card component.
