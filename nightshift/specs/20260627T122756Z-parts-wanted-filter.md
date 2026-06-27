# Spec: parts-wanted-filter

**UTC:** 2026-06-27T122756Z  
**Pillar:** Pillar 1 — Frictionless listing posting (data quality bug; directly affects posting value — sellers' legitimate listings are buried in parts noise)  
**Tag:** `[P1][bug]`

## Goal
Stop parts/WANTED ads from appearing on any buyer-facing aircraft surface: browse, "Similar aircraft" rail, and sitemap.

## Problem
The Barnstormers adapter leaks non-aircraft rows — cowl parts, wheel pants, WANTED ads — into `aircraft_for_sale`. A display-side title filter was added to the main browse query (`AircraftSaleList.tsx`) with 4 patterns (`%wanted%`, `%wheelpant%`, `%wheel pant%`, `% assembly%`), but:
1. The pattern list is incomplete (missing cowling, fairing, engine-only, etc.)
2. The filter is missing from `getSimilarAircraftForSale` (the "Similar aircraft" rail on listing detail pages)
3. The filter is missing from `getForSaleListingSitemapRows` (parts pages entering the sitemap waste crawl budget)

## Scope (files to touch)
- **NEW** `src/lib/partsFilter.ts` — canonical list of parts/WANTED title patterns + typed helper
- `src/components/AircraftSaleList.tsx` — replace 4 hardcoded patterns with the shared constant
- `src/lib/aircraftForSale.ts` — apply filter in `getSimilarAircraftForSale` and `getForSaleListingSitemapRows`

## Acceptance criteria
1. `src/lib/partsFilter.ts` exports `PARTS_TITLE_PATTERNS` (string[] of ilike patterns) and a typed `applyPartsTitleFilter` helper.
2. The pattern list covers at minimum: wanted, wheelpant, wheel pant, assembly, cowling, fairing, accepting orders, engine only — all high-confidence, no false positives.
3. `AircraftSaleList.tsx` browse query uses the shared constant (no longer hardcodes the 4 old patterns separately).
4. `getSimilarAircraftForSale` applies the same filter (previously unfiltered).
5. `getForSaleListingSitemapRows` applies the same filter (previously unfiltered).
6. `npx next build` passes with zero TypeScript errors.
7. QA smoke on `/aircraft` and `/aircraft/listing/[id]` exits 0, no console errors.

## Out of scope
- DB backfill of existing junk rows (needs admin/human action; no destructive SQL this cycle)
- Modifying the external Barnstormers scraper (not in codebase)
- Description-based filtering (too broad; risk of false positives on legitimate listings)
- Adding a `category`/`is_aircraft` DB column (slice 3 in backlog)
