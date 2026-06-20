# Spec — State-level aircraft-for-sale pages (SLICE 1)

Lane: `[goal]` · scoreboard at orient: **54** (scoreboard prints 60 pageviews/7d)

## Goal
Ship a new programmatic page family `/aircraft/for-sale/[state]` (e.g.
`/aircraft/for-sale/california`) that lists every active for-sale aircraft located
in that state, with a short unique intro — targeting the #1 geo autocomplete
pattern "aircraft for sale {state}". Mirror the existing
`/partnerships/state/[state]` + make+model SEO conventions so the new family is
consistent and reaches Google via sitemap + crawlable internal links.

## Data model (verified against the live DB)
`aircraft_for_sale.state` stores **USPS codes** (CA, FL, TX, …) — the exact keys
of `STATE_NAMES`/`STATE_CODES` in `src/lib/seo.ts`. `AircraftSaleList` already
filters by it: `query.eq('state', filters.state)`. Active-listing counts (queried
2026-06-20): CA 170, FL 159, TX 124, … HI/DE/RI 1 each; **all 50 states have ≥1
active listing**, 564 listings have a null state. Every non-null value maps to a
real `STATE_NAMES` key (verified — no DC/PR/garbage codes).

## Scope (small)
- NEW `src/app/aircraft/for-sale/[state]/page.tsx` — dynamic route.
  - `generateStaticParams` over `STATE_CODES` (slug = lowercase full name, e.g.
    `california`, matching the partnerships/state slug format which uses the code;
    BUT the task asks for `/aircraft/for-sale/california` → slug by **full name**).
    Use a name→slug + slug→code map (added to `seo.ts`).
  - Unknown slug → `notFound()`. **Live count === 0 → `notFound()`** (count>0 gate,
    so no thin/doorway/empty pages, mirrors the make+model route's guard).
  - Title (absolute): `"Aircraft for sale in {State} — {N} aircraft | ClubHanger"`.
  - Unique H1 (`{State} aircraft for sale`), unique meta description woven with N
    + state, self-referential `<link rel=canonical>` to
    `${SITE_URL}/aircraft/for-sale/{slug}`.
  - Breadcrumbs (reuse `Breadcrumbs`): Home › Aircraft for Sale › {State}.
  - Short unique intro paragraph + the listing list (`AircraftSaleList` with
    `filters={ state: code, basePath }` so paging stays on-route) + a cross-link
    rail to other states + back to `/aircraft`.
- EDIT `src/lib/seo.ts` — add `stateSlug(name)` / `getStateBySlug(slug)` helpers +
  a live-count helper is NOT here (counts live in AircraftSaleList, like make+model).
- NEW `countForSaleState(code)` exported from `src/components/AircraftSaleList.tsx`
  (mirror of the existing `countMakeModel`) — single source of truth for the live
  count used by the page title/H1/guard AND the sitemap.
- EDIT `src/app/sitemap.ts` — add the state pages, gated to `count>0` via
  `countForSaleState`, exactly like the make+model entries (same source of truth,
  so the sitemap never lists a 404 page).
- EDIT `src/app/aircraft/page.tsx` — add a crawlable "Browse aircraft for sale by
  state" internal-link rail so the new family is reachable by a real link (not just
  the sitemap). This is the inbound-link requirement.

## Acceptance criteria (QA grades these)
1. `npx next build` + typecheck pass.
2. `/aircraft/for-sale/california` (and ≥1 other, e.g. `/aircraft/for-sale/texas`)
   render HTTP 200 with REAL listings, unique title `Aircraft for sale in
   California — {N} aircraft | ClubHanger`, unique H1, and a self-referential
   canonical present in the HTML.
3. Breadcrumbs render (Home › Aircraft for Sale › {State}) and the non-current
   crumbs are real links that navigate.
4. `/sitemap.xml` lists the `/aircraft/for-sale/{slug}` URLs (gated count>0) and
   each resolves HTTP 200 (no 404s).
5. The count>0 gate works: an unknown state slug (`/aircraft/for-sale/atlantis`)
   returns HTTP 404 — NOT a thin page. (All 50 real states currently have
   inventory, so a real zero-state can't be shown today; the gate is proven via
   the unknown-slug 404 + code review of the `count===0 → notFound()` guard.)
6. No horizontal overflow at 375px; no console / hydration errors at desktop + 375px.
7. `/aircraft` shows a crawlable internal link to at least one state page.

## Out of scope (DEFER — note in CHANGELOG Next:)
- Cross-linking every make+model within each state (slice 3).
- Price / under-$X variants.
- JSON-LD beyond the BreadcrumbList the Breadcrumbs component already emits.
- NO schema change (read-only over existing `state` column).
