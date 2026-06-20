# Spec — make-only for-sale aggregation pages: `/aircraft/[make]`

UTC: 2026-06-20T12:17:47Z · Lane: **[goal]** (SEO breadth) · Slug: `aircraft-make-pages`

## Goal
Fill the structural gap between `/aircraft` and `/aircraft/[make]/[model]` by shipping a
make-level for-sale aggregation page at `/aircraft/[make]` (e.g. `/aircraft/cessna`) that
targets the high-volume "{make} for sale" query and funnels crawl equity DOWN into the
existing model pages via a real, unique per-model breakdown — never a thin duplicate.

## Why this grows pageviews ([goal] rationale)
"cessna for sale" / "piper for sale" are top autocomplete patterns. The model pages already
rank for "cessna 172 for sale" but there is no page for the broader make query. A make-level
page that aggregates all of a make's models (each with a live count, linking to the model
page) is a genuinely unique aggregate node, deepens internal linking, and adds a new
indexable page family to the sitemap.

## Scope (small)
- NEW `src/app/aircraft/[make]/page.tsx` — the make-level page (metadata + render).
- `src/lib/seo.ts` — add a tiny `resolveMake(slug)` + `getInventoryMakes()` helper that
  groups the EXISTING `getInventoryMakeModels()` output by makeSlug (single source of truth;
  no new query, no schema change).
- `src/app/sitemap.ts` — emit `/aircraft/[make]` URLs ONLY for makes that have ≥1 model with
  live inventory (reuse the count helpers already used for make+model).
- `src/app/aircraft/[make]/[model]/page.tsx` — add the make page as a breadcrumb crumb
  (one-liner, low risk) so the model page links back UP to the make page.

## Acceptance criteria (QA grades against these)
1. `/aircraft/cessna` returns **200**, renders an H1 "{Make} aircraft for sale", a real
   **per-model breakdown** (e.g. "Cessna 172 — N for sale") where each model links to its
   `/aircraft/[make]/[model]` page, and the served HTML contains the title + those model links.
2. `generateMetadata` is unique: title `"{Make} aircraft for sale — {N} listings | ClubHanger"`,
   a unique meta description, `<link rel=canonical>` to the make URL, and OpenGraph.
3. JSON-LD: a BreadcrumbList (Home > Aircraft for Sale > {Make}) and a CollectionPage/ItemList
   marking up the model breakdown — real data only, no fabrication.
4. A nonexistent/thin make (e.g. `/aircraft/zzz-nope`, or a make with no inventory) returns
   **404** (notFound) — never an empty page.
5. The make URLs appear in `/sitemap.xml`, and ONLY for makes with live inventory.
6. Mobile-first 375px: no horizontal overflow; sky-blue accent only; no console/hydration
   errors on the production build (`npm run start`).

## Out of scope
- No schema change, no SQL, no new DB columns, no ingest/auth/admin/env/FREEZE files.
- No per-listing detail page; no redesign of the model/state pages.
- No make-level price snapshot beyond what the model breakdown already conveys (keep slice small).
