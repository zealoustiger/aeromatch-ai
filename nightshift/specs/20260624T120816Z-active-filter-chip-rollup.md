# Spec — Collapse model-variant active-filter chips into one "(all)" parent chip

**Slug:** `active-filter-chip-rollup`
**Lane:** `[want]` (last non-bug cycle `model-curate-diamond-da40` pulled `[goal]` → alternate to `[want]`)
**Date:** 2026-06-24

## Goal
On `/aircraft`, when a pilot selects a rolled-up model group (e.g. "SR20 (all)"
expands to SR20, Sr20 G2, SR20-G2, SR20-G3, SR20-G6…), the results-header active-filter
chips should show **one** "{base} (all)" chip — removing it deselects every member —
instead of one cluttered chip per variant. This completes the explicitly-flagged
"Remaining" item of the recently-shipped, human-requested `model-filter-variant-rollup`
P2 want (the human screenshotted the variant clutter).

## Scope (small)
- `src/components/ActiveFilterChips.tsx` — accept an optional `facets` prop; when a
  selected make has a multi-variant model group whose members are **all** selected,
  emit one parent chip whose removal strips all members. Partially-selected groups,
  singleton groups, and models not present in facets keep rendering per-model (today's
  behaviour, unchanged).
- `src/app/aircraft/page.tsx` — pass the already-loaded `facets` into `ActiveFilterChips`.

## Acceptance criteria
- Selecting "SR20 (all)" (all SR20 variants) shows a single `SR20 (all)` chip; clicking
  its × removes every SR20 variant from the `model` param and returns to page 1.
- Selecting only **some** variants of a group still shows those variants as individual
  chips (no false "(all)" collapse).
- A singleton model (e.g. a make with one model) still renders its own per-model chip.
- All other chips (make, state, price, year, total time, grade, keyword, drops) are
  unchanged; "Clear all" still appears when >1 chip.
- `npx next build` + typecheck pass; QA smoke (HTTP 200, no app-origin console errors,
  no horizontal overflow at 1280 + 375) passes on `/aircraft` (incl. a multi-variant
  model selection) and the screenshots look right.

## Out of scope
- The mobile drawer / sidebar Model filter itself (already ships the rollup).
- Partnerships / seeking active-filter chips (separate components; future slice).
- Any query/schema change — purely presentational regrouping of existing `model` param.
