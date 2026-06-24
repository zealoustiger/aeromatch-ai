# Spec — filter-promote-core-fields

**Lane:** [want] (last non-bug cycle `cost-calculator-faq-jsonld` pulled [goal]; last cycle
PASS so no blocker → [want] owed per the 1:1). Closes the screenshot-backed
**[P2][want] "Promote Price/Year/Total-Time out of 'More filters'; drop Listing Quality"**
backlog item.

## Goal
On the `/aircraft` (Planes for Sale) browse filter panel, make the three core buying
criteria — **Price, Year, Total Time** — always visible instead of hidden inside the
collapsed "More filters" disclosure, and **remove the "Listing quality" filter control**.

## Scope
- `src/components/AircraftSaleFilters.tsx` — the single shared filter component (rendered
  both in the desktop sidebar and inside the mobile `MobileFiltersDrawer`, so one edit
  fixes both):
  1. Move the **Price ($)**, **Year**, and **Total Time (hrs)** range inputs OUT of the
     "More filters" disclosure into the always-visible main panel, placed right under
     Make → Model (the core buyer criteria, leading the panel).
  2. **Remove the "Listing quality" multi-select** block (the A/B/C grade checkboxes),
     plus its now-unused helpers (`toggleGrade`, `GRADE_OPTIONS`, `selectedGrades`).
  3. Reduce "More filters" to just **State** (the only remaining secondary dimension);
     update `SECONDARY_KEYS` so the disclosure auto-opens only when `state` is active.

## Out of scope
- No change to the server-side query builder (`src/lib/seo.ts`) — it keeps honoring a
  legacy/saved-search `grade`/`min_grade` URL param harmlessly; with the control gone, no
  new grade params are created from the UI. (Removing the *control* is what "drop the
  filter" means; not touching the query keeps old saved searches working and is lowest-risk.)
- No change to `ActiveFilterChips.tsx` — its grade chip only renders if a legacy `grade`
  param is present in the URL (none get created now), so it stays as harmless legacy support.
- No new filter fields (avionics/SMOH remain deferred). No schema. No partnerships/seeker
  filter changes.

## Acceptance criteria
1. On `/aircraft`, **Price, Year, and Total Time inputs are visible without expanding any
   disclosure** (always-on in the main panel), positioned under Make/Model.
2. The **"Listing quality" (Grade A/B/C) filter is gone** from the panel (desktop + mobile).
3. "More filters" now contains **only State**; it still auto-opens when a `state` filter is
   already active via a URL param.
4. Each promoted range still updates the URL params (`min_price`/`max_price`,
   `min_year`/`max_year`, `min_tt`/`max_tt`) and filters results correctly.
5. `npx next build` + typecheck green; QA smoke (production build) exit 0 on `/aircraft`
   at desktop 1280 + mobile 375 (HTTP 200, zero app-origin console errors, zero overflow);
   screenshots show the reorganized panel rendering cleanly at both viewports.
