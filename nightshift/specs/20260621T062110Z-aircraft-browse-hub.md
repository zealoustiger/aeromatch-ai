# aircraft-browse-hub — HTML "browse all" hub page (slice 1: /aircraft/browse)

## Goal
Ship a single crawlable HTML hub at `/aircraft/browse` that internally links to every existing for-sale programmatic page family (make pages, inventory-backed make+model pages, and inventory-backed for-sale-by-state pages), so Google has an HTML path to crawl the programmatic pages (STAGE=INDEXING; internal linking is the #2 indexing lever).

## Scope (small, additive only)
- NEW: `src/app/aircraft/browse/page.tsx` — the hub page (server component).
- EDIT: `src/app/sitemap.ts` — add `/aircraft/browse` to the static pages.
- EDIT: `src/app/aircraft/page.tsx` — add one crawlable link to `/aircraft/browse` from the existing browse-by-state panel area so crawlers (and humans) discover the hub.

## Approach
- Reuse the SAME data helpers the sitemap uses (single source of truth, no drift, no fabricated routes):
  - Make pages + make+model pages: `getInventoryMakeModels()` + `countMakeModel()` — keep only combos with live count > 0; a make is "live" iff ≥1 of its model combos has count > 0 (mirrors sitemap lines 89–119).
  - For-sale-by-state pages: `STATE_CODES` + `countForSaleState()` — keep only states with count > 0 (mirrors sitemap lines 139–150).
- Organize into 3 clearly-labelled sections: "By make", "By make & model", "By state". Not a wall of links.
- SEO metadata mirrors `/aircraft/[make]` pattern: unique title + meta description, `alternates.canonical: '/aircraft/browse'`, full OpenGraph + Twitter using `SITE_URL`/`SITE_NAME`/`DEFAULT_OG_IMAGE`, and a `Breadcrumbs` trail Home › Aircraft › Browse.
- Reuse `.ch-panel` / `ch-surface` cream tokens for cohesion. No new colors/dependencies.

## Acceptance criteria
1. `/aircraft/browse` renders with 3 sections (By make, By make & model, By state); every link points at a REAL inventory-backed route (no fabricated/404/empty-inventory links).
2. Served HTML contains: `<link rel="canonical" href=".../aircraft/browse">`, complete OpenGraph (og:url/title/description/image) + twitter card, and a breadcrumb trail Home › Aircraft › Browse.
3. `/sitemap.xml` includes `/aircraft/browse`.
4. The hub is reachable via a crawlable `<a>` link added to `/aircraft`.
5. Spot-checked sample make / make+model / state links resolve to 200.
6. `npx next build` + typecheck green; no console/hydration errors; zero 375px horizontal overflow at 375px and desktop 1280.

## Out of scope
- No schema/DB/SQL change. No new components, colors, or dependencies.
- No changes to the programmatic page routes themselves.
- No global-footer redesign (single link addition on /aircraft is sufficient for crawl discovery).
