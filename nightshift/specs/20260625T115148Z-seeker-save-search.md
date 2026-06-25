# Spec: seeker-save-search

**UTC:** 2026-06-25T115148Z  
**Slug:** seeker-save-search  
**Lane:** [want]

## Goal
Add "Save this search" to the `/partnerships/seeking` browse page — parity with `/aircraft` and `/partnerships`, which already have the button in both the desktop filter panel and the mobile drawer. Aircraft owners browsing for seeker pilots should be able to save their preferred filter criteria (make, airport, rating, etc.) and get back to that search later.

## Scope
4 files:
1. `src/lib/savedSearchName.ts` — add `nameSeeker()` function; update `autoNameSearch()` to route `/partnerships/seeking` path to it; add unit tests in `savedSearchName.test.ts`
2. `src/components/SeekerFilters.tsx` — add `saveSearchBasePath?: string` prop, import `SaveSearchButton`, render it above "Clear all" when filters are active (mirrors partnership/aircraft filter pattern exactly)
3. `src/components/MobileFiltersDrawer.tsx` — pass `saveSearchBasePath="/partnerships/seeking"` to `SeekerFilters` in the `variant === 'seeker'` branch (1-line change)
4. `src/app/partnerships/seeking/page.tsx` — pass `saveSearchBasePath="/partnerships/seeking"` to the desktop `SeekerFilters`; add `<SaveSearchButton basePath="/partnerships/seeking" />` to the results header (after SeekerActiveFilterChips, before SeekerList)

## Acceptance criteria
- [ ] Desktop `/partnerships/seeking` filter panel shows "Save this search" button when ≥1 filter is active; button is absent when no filters are set
- [ ] Mobile filter drawer (variant="seeker") shows the same button
- [ ] Clicking "Save this search" auto-names the search from active filters (e.g. "Cessna seekers near KPAO · PPL, IFR") and saves to `/searches`
- [ ] Auto-name reads seeker-specific params: `airports`/`airport`, `make`, `rating`, `min_hours`, `share_type` (not the partnership-listings params)
- [ ] No horizontal overflow at 375px; no console errors
- [ ] `npx next build` passes (TypeScript + compile)

## Out of scope
- Changing the save-search flow itself (already works for any basePath)
- Saving searches for seeker detail pages
- Showing a results header save button (adding it to the results content area is optional if the panel version suffices)
