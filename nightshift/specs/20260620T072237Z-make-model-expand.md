# SLICE 2 — Expand `/aircraft/[make]/[model]` to ALL inventory-backed combos

UTC: 2026-06-20T07:22Z · lane: `[goal]` · scoreboard at orient: 54 (60 pageviews/7d)

## Goal
Grow the for-sale make+model page family from the HARDCODED ~20-combo
`SEO_MAKE_MODELS` list to EVERY make+model family that has real for-sale inventory
(count > 0), derived dynamically from the DB — more real-inventory pages = more
indexable pages = the core pageview lever — while keeping ONE source of truth so
route + sitemap + rails never drift and never producing thin/empty/near-duplicate
pages.

## Approach
- Add an async helper `getInventoryMakeModels()` in `src/lib/seo.ts` that:
  - Reads `make, model` from `aircraft_for_sale` where `status='active'` via a
    **cookieless anon read client** (build-safe; works in `generateStaticParams`).
  - Normalizes each row to a clean make-slug + family model-slug using the SAME
    slug conventions slice 1 uses (cessna/172, cirrus/sr22). Handles messy data:
    skips null/blank make or model; skips a denylist of non-manufacturer "makes"
    (experimental, biplane, amphibian, antique-classic, float plane, hangar, land,
    single family, other, piston helicopter, turbine helicopter, custom-built);
    collapses Cirrus SR G-suffix variants into sr20/sr22/sr22t; strips trailing
    variant letters on number models (182p→182, 172m→172); drops junk family
    tokens.
  - Groups by make+family, keeps only families with **count ≥ 3** (substantive,
    not thin/singleton/near-dup), then DEDUPES so a narrower family that is a
    strict prefix-subset of a broader generated family is dropped (no m20j page
    when m20 exists).
  - MERGES with the curated `SEO_MAKE_MODELS` — curated entries always win
    (their hand-tuned slug/specs/costToOwn), dynamic-only families get
    generic-but-honest specs/costToOwn copy (no fabricated specifics).
  - On any DB failure returns the static `SEO_MAKE_MODELS` (graceful build-time
    fallback — never crash the build).
- Add async `resolveMakeModel(makeSlug, modelSlug)` in `seo.ts`: curated match
  first (sync `getMakeModel`), else look it up in `getInventoryMakeModels()`.
  Returns `null` for unknown combos.
- `generateStaticParams` (page.tsx) → async, returns the full inventory-backed
  combo list from `getInventoryMakeModels()`. Keep `dynamicParams = true`
  (default) so any not-prebuilt-but-valid combo still renders on demand and the
  existing `n===0 → notFound()` guard 404s zero-inventory/garbage combos.
- `page.tsx` + `generateMetadata` use async `resolveMakeModel` (was sync
  `getMakeModel`). Everything slice 1 did per page is preserved: unique
  title/H1/meta, canonical, breadcrumbs, ItemList/Product+Offer JSON-LD.
- `sitemap.ts` uses the SAME `getInventoryMakeModels()` helper so the sitemap
  lists exactly the prebuilt+inventory-backed pages (gated count>0 via the
  existing `countMakeModel`), no 404s, no missing pages.
- Related-combos rail: keep working — uses the merged list (or curated subset),
  capped to 12.

## Scope (small)
- `src/lib/seo.ts` — `getInventoryMakeModels()`, `resolveMakeModel()`, a tiny
  cookieless anon read client (or reuse one), normalizer helpers.
- `src/app/aircraft/[make]/[model]/page.tsx` — async `generateStaticParams`,
  async resolver in page + metadata, rail uses merged list.
- `src/app/sitemap.ts` — make+model section uses the helper.
- NO schema change. NO new route. NO frozen file touched.

## Acceptance criteria
1. Build + typecheck pass (`npx next build`, `npx tsc --noEmit` clean for touched files).
2. Page count grows well beyond the original ~20: `generateStaticParams` emits the
   full inventory-backed set (expect ~60–80 combos).
3. Spot-check 3–4 combos NOT in the original 20 that DO have inventory → HTTP 200,
   real listings, unique title + H1.
4. A zero-inventory / garbage combo does NOT have a live thin page (404).
5. `/sitemap.xml` lists the expanded set; a sampled NEW url from it resolves 200.
6. No console / hydration errors; no 375px horizontal overflow on a sampled page.

## Out of scope
- New schema / migrations / new routes.
- Re-writing curated specs/copy for the original 20.
- Per-variant micro pages (m20j, sr22-g6) — explicitly avoided as near-dupes.
- Changing the partnerships make/state families.
