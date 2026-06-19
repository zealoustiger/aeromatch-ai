# Spec — Aircraft Total Time filter + progressive disclosure (Filter overhaul slice 2)

**Date:** 2026-06-19T07:03Z
**Backlog item:** [P1] Filter UI overhaul — slice 2 (secondary Controller-style dimensions, progressive disclosure)
**Branch:** `night/aircraft-total-time-filter`

## Goal
Add a data-backed **Max Total Time (hrs)** filter to `/aircraft`, and tidy the panel so it leads with the primary search path (Make → Model) and tucks the spec/location dimensions behind a collapsible "More filters" disclosure — cleaner than Controller's wall of filters.

## Context / data reality (queried live DB, status='active', n=1856)
- `ttaf` (total time) populated on **951** listings (~51%) — median 2427 hrs, p25 869, p75 4774. Viable filter.
- `smoh` (engine time): **0** populated. `avionics`: **0** populated. → **Do NOT build filters on these** this slice; they'd silently return zero results. Noted for the human (likely an ingest gap; overlaps the in-flight scraper WIP).
- `year`, `asking_price`, `state` already have working filters.

## Scope (files expected to touch — small)
- `src/components/AircraftSaleFilters.tsx` — add Total Time input; wrap secondary filters in a progressive-disclosure section.
- `src/components/AircraftSaleList.tsx` — read `max_tt` param, apply `.lte('ttaf', N)`; add `max_tt` to the `Filters` interface.
- (No schema changes. No new tables. No scraper/card edits — those have uncommitted human WIP.)

## Acceptance criteria (QA grades these)
1. A **"Max Total Time (hrs)"** number input appears on `/aircraft` in both the desktop sidebar and the 375px mobile drawer.
2. Entering a value (e.g. `2000`) narrows results to listings with `ttaf <= 2000`; the result count drops accordingly and clearing it restores the full set.
3. The panel **leads with Make then Model**; State / Max Price / Year (min) / Max Total Time live under a **collapsible "More filters"** control that is collapsed by default.
4. "More filters" **auto-expands** when any filter inside it is already active (via URL param), so an active filter is never hidden.
5. "Clear all filters" still clears every filter including `max_tt`; the mobile active-count badge counts `max_tt`.
6. `npx next build` passes (compile + typecheck); no new console errors on `/aircraft` (a pre-existing LCP image warning is acceptable).

## Out of scope
- Avionics and engine-time (SMOH) filters (no data — see above).
- Any change to the scraper, ingest, or `AircraftSaleCard` (human WIP in tree).
- Map view, AI search, favorites, comparison (other backlog items).
- Schema/migrations.
