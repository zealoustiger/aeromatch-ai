# Spec — Save this search inside the filter panel

**Slug:** `save-search-in-filter-panel`
**Lane:** `[want]` — last non-bug cycle (`aircraft-hub-faq-jsonld`) pulled `[goal]`; last
cycle PASS → no blocker → `[want]` owed per the 1:1 allocation policy.
**Backlog item:** `[P2][want] Add "Save this search" inside the filter panel` (2026-06-24
chat batch, screenshot-backed).

## Goal
Make the existing "Save this search" affordance discoverable where users actually tune
their search — inside the "Filter Results" panel, near "Clear all filters" — while
keeping the existing top-right button.

## Scope (small, additive, no schema)
- `src/components/SaveSearchButton.tsx` — add an optional `fullWidth` prop so the button
  (and its inline save form / saved confirmation) render full-width to fit the narrow
  filter panel. Default `false` = the existing top-bar appearance is unchanged.
- `src/components/AircraftSaleFilters.tsx` — add an optional `saveSearchBasePath` prop;
  when set, render `<SaveSearchButton fullWidth basePath=… />` just above "Clear all
  filters" (only when filters are active, matching the Clear button's condition).
- `src/components/PartnershipFilters.tsx` — same in-panel save button.
- `src/components/MobileFiltersDrawer.tsx` — map the drawer `variant` → basePath
  (`sale`→`/aircraft`, `partnership`→`/partnerships`) and pass it through, so the mobile
  filter sheet gets the same in-context save button.
- `src/app/aircraft/page.tsx` + `src/app/partnerships/page.tsx` — pass
  `saveSearchBasePath` to the desktop filter sidebar.

## Acceptance criteria
1. With at least one active filter, the `/aircraft` and `/partnerships` desktop filter
   panels show a "Save this search" button directly above "Clear all filters".
2. The same in-panel button appears inside the mobile filter drawer (375px) for both
   surfaces, with the correct basePath.
3. The existing top-right "Save this search" button is unchanged (still present, same look).
4. With no active filters, neither the in-panel save button nor "Clear all filters" shows
   (no empty separator / dangling control).
5. Clicking the in-panel button when signed out routes to `/auth?next=…`; when signed in
   it reveals the name-this-search form and saving works (reuses the existing `saveSearch`
   action — no new server code).
6. `npx next build` + typecheck pass; QA smoke (prod build) exits 0 on `/aircraft` and
   `/partnerships` at desktop 1280 + mobile 375 (HTTP 200, no app-origin console errors,
   no horizontal overflow); screenshots look right.

## Out of scope
- Auto-naming / one-click save (separate backlog item).
- The seeking (`/partnerships/seeking`) surface — it has no top-bar save-search today;
  not mirrored this cycle.
- Any change to the `saveSearch` server action, the `saved_searches` schema, or the
  Saved Searches page.
