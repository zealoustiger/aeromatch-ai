# Spec — Sitemap sweep: cover the new programmatic page families

**Slug:** sitemap-sweep
**Lane:** [goal] (SEO breadth — crawl coverage)
**Scoreboard at orient:** 60 pageviews (7d)

## Goal
Extend `src/app/sitemap.ts` so `/sitemap.xml` includes the two page families that
shipped tonight but are currently invisible to crawlers: the `/aircraft/[make]/[model]`
for-sale pages (only the combos that actually have live inventory) and the two
`/tools/*` calculator pages.

## Scope (files expected to touch)
- `src/app/sitemap.ts` — add the make+model URLs (derived from the SAME source the
  page route uses, so they never drift) and the two `/tools/*` static URLs.
- No new helper expected: `SEO_MAKE_MODELS` + the exported `countMakeModel()` from
  `src/components/AircraftSaleList.tsx` are already the shared source of truth. Reuse
  them — a make+model URL is emitted only when `countMakeModel(...) > 0`, exactly
  mirroring the page route's `notFound()` guard (n === 0 → 404).

## Acceptance criteria
1. `npx next build` + TypeScript pass; `/sitemap.xml` builds with the existing
   try/catch fallback intact (Supabase unavailable at build → still emits the static
   + non-DB families, no crash).
2. `/sitemap.xml` is valid XML served from the PRODUCTION build (`npm run start`).
3. It now contains `/aircraft/<make>/<model>` URLs AND `/tools/cost-calculator` +
   `/tools/earnings-calculator`.
4. The make+model URLs correspond to combos with real inventory only — derived via
   `countMakeModel > 0`, so no soft-404 / empty combos. Spot-check 2-3 make+model
   URLs resolve HTTP 200 (not 404).
5. No garbage/empty/duplicate combos added; existing sitemap entries (home,
   partnerships, aircraft, about, state pages, make pages, airport pages, listing
   pages) are all still present.

## Out of scope
- No JSON-LD, no internal-linking changes, no new pages.
- No schema/DB change (read-only count queries only).
- No changes to the page route, the calculators, or `seo.ts`.
- Price/state make+model variants and combos beyond the curated top-20 (future slices).
