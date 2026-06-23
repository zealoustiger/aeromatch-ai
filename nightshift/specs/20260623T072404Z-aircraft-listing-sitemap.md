# Spec — aircraft-listing-sitemap

## Goal
Add the new internal `/aircraft/listing/[id]` detail-page family (shipped last cycle)
to `sitemap.xml`, gated to real priced aircraft, so search engines have a crawl path
to this brand-new set of unique indexable pages.

## Why (lane + stage)
- **[goal] lane** — last non-bug cycle (`internal-aircraft-listing-detail`) pulled
  [want]; no blocker outstanding, so [goal] is owed per the 1:1.
- **STAGE=INDEXING** — getting a new, genuinely-unique indexable family discoverable
  via the sitemap is the #1 indexing lever (sitemap freshness + crawl path). The detail
  pages already self-canonicalize and carry OG/title metadata; they were just orphaned
  from the sitemap. This is the SEO-infrastructure portion of the `[P1][want] Internal
  listing detail pages` slice 4 (the JSON-LD + homepage-rail-wiring portions are left
  for that [want] slice).

## Scope (small)
- `src/lib/aircraftForSale.ts` — add `getForSaleListingSitemapRows()`: returns id +
  freshness columns for **active** listings with `asking_price >= 50000`, paginated so
  the result is not silently capped at PostgREST's 1000-row default. Internal try/catch
  → `[]` on any failure (never throws).
- `src/app/sitemap.ts` — call the helper inside the existing data block, map each row to
  `${SITE_URL}/aircraft/listing/${id}` with a data-derived `lastModified`
  (`maxDate(price_changed_at, last_seen_at, created_at)`), append to the returned array.

## Acceptance criteria
1. `npx next build` + typecheck pass (no new errors beyond the pre-existing `.test.ts` baseline).
2. The production-built `/sitemap.xml` contains `/aircraft/listing/<real-id>` URLs for
   priced active listings.
3. Sub-$50k / no-price listings do **NOT** appear as listing URLs in the sitemap
   (matches the data-quality "don't index parts/projects/no-price" rule → no thin/junk pages).
4. Each listing URL carries a `<lastmod>` derived from real data (or none if no date is parseable).
5. The result is not truncated at 1000 (pagination loop verified) — sitemap URL count
   reflects the full priced-active set.
6. qa-smoke exit 0 on `/aircraft` + a real `/aircraft/listing/[id]` at desktop 1280 +
   mobile 375 (HTTP 200, zero app-origin console errors, zero horizontal overflow) —
   no regression to the rendered pages.

## Out of scope
- Vehicle/Offer JSON-LD on the detail page (that's [want] slice 4).
- Wiring the homepage `AircraftRailCard` to the detail page (that's [want] slice 4).
- Any change to the detail page render, the browse pages, or the price floor on buyer surfaces.
- Quality-score-based gating beyond the $50k price floor (possible future refinement).
