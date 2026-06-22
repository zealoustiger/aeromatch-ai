# Spec — `/partnerships/browse` hub page (HTML "browse all" — slice 2)

## Goal
Give the partnership programmatic families (make / state / near-airport) a single
crawlable HTML index — `/partnerships/browse` — so Google (and humans) can reach
every live partnership landing page from one hop, the #2 indexing lever after
backlinks (STAGE=INDEXING). This is **slice 2** of the [P1][goal] "HTML browse-all
hub pages" item; slice 1 (`/aircraft/browse`) already shipped.

## Lane
[goal]. Last non-bug cycle (listing-quality-guide) was [want]; last cycle PASSed
(no blocker). So [goal] is owed.

## Scope (small, additive)
- NEW `src/app/partnerships/browse/page.tsx` — server component mirroring the
  proven `/aircraft/browse` page: sections "By make", "By state", "Near an
  airport"; Breadcrumbs; canonical + OpenGraph + Twitter metadata; CollectionPage
  (ItemList) JSON-LD over the make hub pages; cream `ch-surface`/`ch-panel` tokens;
  sky accent. Every link is gated on a LIVE count > 0 so no link points at an
  empty/thin family (no doorway pages — GOAL.md).
- `src/lib/partnershipsQuery.ts` — add `countPartnershipsByMake(filter)` and
  `countPartnershipsByState(code)` count helpers (mirror `countForSaleState`,
  head:true exact count). Mock fallback returns counts from `MOCK_PARTNERSHIPS`.
- `src/lib/nearbyPartnerships.ts` — refactor the existing
  `getNearAirportSitemapIcaos` core into a shared `computeNearAirportHubs()` that
  returns `{ icao, name, city, state, count }[]`; existing icaos function delegates
  to it (sitemap behavior byte-identical), and add `getNearAirportHubs()` for the
  hub page (so the near section shows real airport names, not bare ICAOs).
- `src/app/sitemap.ts` — add `/partnerships/browse` to staticPages.
- `src/app/partnerships/page.tsx` — add a "Browse all makes, states & airports →"
  link to the hub (mirrors the `/aircraft` → `/aircraft/browse` link) so the hub is
  reachable by crawlers.

## Acceptance criteria
1. `/partnerships/browse` returns HTTP 200 at desktop 1280 + mobile 375, zero
   app-origin console errors, zero horizontal overflow (qa-smoke exit 0).
2. The page links each partnership **make** with ≥1 active listing to
   `/partnerships/make/[slug]`, each **state** with ≥1 active listing to
   `/partnerships/state/[code]`, and each **near-airport** hub (≥ MIN_NEARBY) to
   `/partnerships/near/[icao]` — counts shown, all real live pages (no link to an
   empty family).
3. Served HTML carries a self-canonical (`/partnerships/browse`), OpenGraph/Twitter
   tags, and exactly one parseable `CollectionPage` JSON-LD block.
4. `/partnerships` renders a visible link to `/partnerships/browse`.
5. `/partnerships/browse` is present in `sitemap.xml`.
6. The existing `/partnerships/near/[icao]` sitemap set is unchanged by the
   nearbyPartnerships refactor (same ICAO set).
7. `npx next build` + `tsc --noEmit` green (only pre-existing baseline test errors).

## Out of scope
- No schema/DB/SQL change. No new dependency/color/component.
- No changes to the make/state/near page routes themselves (only the new hub +
  its data helpers + one link + sitemap line).
- No partnership "by make & model" section (partnerships aren't modeled by model).
