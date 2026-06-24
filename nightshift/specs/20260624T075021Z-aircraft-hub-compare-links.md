# aircraft-hub-compare-links

## Goal
Spread crawl equity from the high-authority `/aircraft` hub (priority seed page #2) into
the curated head-to-head comparison family (`/aircraft/compare/[slug]`) by adding a
"Compare aircraft head-to-head" block of crawlable internal links — mirroring the existing
"Browse aircraft by mission" block. STAGE=INDEXING, internal linking is the #2 lever.

## Why this grows pageviews
The `/aircraft/compare` family currently has internal links only FROM individual model seed
pages. The `/aircraft` hub — the #2-trafficked page and a priority seed page — does not link
to it at all, so crawlers reaching the hub can't follow into the comparison family from there.
Adding the block concentrates crawl budget + link equity from a high-authority page into a
family that targets the very high-volume "{model} vs {model}" buyer query class. Leading
indicator, not a tonight-pageview play (SEO lift lags weeks).

## Scope (small)
- `src/app/aircraft/page.tsx` — add ONE `ch-panel` block after the "Browse aircraft by mission"
  block (around line 224), titled "Compare aircraft head-to-head", rendering one internal
  `<Link href={/aircraft/compare/[slug]}>` per `COMPARISONS` entry, labelled via the existing
  `comparisonLabel(c)` helper (skips any pair whose label fails to resolve), plus a
  "View all comparisons →" link to the `/aircraft/compare` hub.
- Import `COMPARISONS` + `comparisonLabel` from `@/lib/aircraftComparisons`.

## Acceptance criteria
- `/aircraft` renders a new "Compare aircraft head-to-head" section with one real internal
  `<a href="/aircraft/compare/...">` per curated comparison (8 today) + a link to `/aircraft/compare`.
- Every emitted href resolves to a real curated page (built from `COMPARISONS` slugs — the same
  source of truth the route + sitemap share); no fabricated or 404 links.
- Labels come from `comparisonLabel` (e.g. "Cessna 172 vs Cirrus SR22"); any pair returning null
  is skipped (defensive — none today).
- `npx next build` + typecheck pass (no new errors in the touched file).
- QA smoke on `/aircraft` exits 0 at desktop 1280 + mobile 375 (HTTP 200, zero app-origin console
  errors, zero horizontal overflow); screenshots show the block wraps cleanly with no overflow.

## Out of scope
- No new pages, no schema/DB change, no sitemap change (compare pages are already in the sitemap).
- No changes to the comparison pages themselves or to the model-page → compare links.
- No restyling of the existing hub blocks.
