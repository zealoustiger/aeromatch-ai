# Model-in-state for-sale intersection pages

## Goal
Ship a new quality indexable page family — `/aircraft/[make]/[model]/[state]`
("Cessna 172 for sale in California") — listing for-sale aircraft filtered to BOTH
a specific make+model family AND a specific state, targeting the #1 autocomplete
intent (`cessna 172 for sale california`). [goal] lane.

## Scope (files expected to touch)
- NEW `src/app/aircraft/[make]/[model]/[state]/page.tsx` — the intersection route.
- `src/components/AircraftSaleList.tsx` — add `countMakeModelState(make, modelPattern, notModelPattern, code)` (head/count query; single source of truth for the count and the thin-page guard).
- `src/lib/seo.ts` — add `getInventoryMakeModelStates()` (the inventory-backed (make,model,state) combos with >= threshold listings; shared by generateStaticParams + sitemap so they can't drift).
- `src/app/sitemap.ts` — emit the inventory-backed intersection URLs from that same helper.
- `src/app/aircraft/[make]/[model]/page.tsx` — point the existing "Browse {Model} by state" rail at the new intersection pages instead of the bare state pages (low-risk, same data source `topStatesForMakeModel` which already guarantees >=1 listing of THIS family in that state — but I'll gate to >= threshold to never link to a sub-threshold 404).

## Acceptance criteria
1. `/aircraft/cessna/172/california` (a real inventory-backed combo) returns 200 and renders the in-state Cessna 172 listings via the existing card/list, with the title "Cessna 172 for sale in California — {N} aircraft | ClubHanger" and `<link rel=canonical>` in the served HTML.
2. A combo with no/below-threshold inventory, OR a bogus make/model/state slug, returns 404 (`notFound()`). Verified for at least one bogus state and one valid-combo-but-empty state.
3. `generateStaticParams` + the sitemap emit ONLY (make,model,state) combos with >= threshold (3) live listings, from ONE shared helper. New URLs appear in `/sitemap.xml`.
4. Unique `generateMetadata`: title pattern above, unique meta description, canonical, OpenGraph; BreadcrumbList + ItemList JSON-LD via `buildAircraftItemListJsonLd` (real data only).
5. Breadcrumb Home → Aircraft for Sale → {Make} {Model} → {State}; links up to `/aircraft/[make]/[model]` and `/aircraft/for-sale/[state]`. Parent model page links DOWN to its top in-state intersection pages.
6. `npx next build` + `npx tsc --noEmit` pass (only the 3 pre-existing .test.ts baseline errors allowed). No console/hydration errors; no horizontal overflow at 375px. Sky-blue accent only.

## Out of scope
- Price variants (`under $X`), "near me" geolocation.
- Any schema change / SQL / new DB columns.
- Per-variant micro pages (we stay family-level, mirroring existing pages).
- Touching auth/admin/ingest/env/FREEZE files.

## Notes
- PostgREST caps reads at 1000 rows; the param/sitemap helper paginates with
  `.range()` to see all 1856 active rows so the combo set is complete (~42 combos
  at threshold 3). Small enough — no cap needed.
- Threshold 3 mirrors the existing `DYNAMIC_MIN_COUNT` for model families.
