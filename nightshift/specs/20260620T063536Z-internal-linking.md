# Internal linking graph — SLICE 1: breadcrumbs + listing→family links

## Goal
Wire the new `/aircraft/[make]/[model]` for-sale family pages into the UI's internal-linking
graph so crawlers and humans can discover them: add a reusable, crawlable Breadcrumbs component
to the key programmatic pages, and link each for-sale listing card to its make+model family page
(only when that page actually exists).

## Scope (files expected to touch — keep small)
- `src/components/Breadcrumbs.tsx` (NEW) — reusable, crawlable `<Link>` breadcrumbs, sky-blue,
  mobile-first 375px, emits BreadcrumbList JSON-LD (matches repo's existing ld+json pattern).
- `src/lib/seo.ts` — add `resolveMakeModelFamily(make, model)` that reuses the SAME source of
  truth (`SEO_MAKE_MODELS` + the same `modelPattern`/`notModelPattern` ilike semantics the route
  and DB query use) so a link is only emitted for a combo that has a real page.
- `src/app/aircraft/[make]/[model]/page.tsx` — replace the inline breadcrumb with `<Breadcrumbs>`
  (Home › Aircraft for Sale › {Make} {Model}).
- `src/app/aircraft/page.tsx` — add `<Breadcrumbs>` (Home › Aircraft for Sale). Currently has none.
- `src/components/AircraftSaleCard.tsx` — add a "See all {Make} {Model} for sale" link to the
  resolved family page, ONLY when one exists.

## Source of truth (no 404s)
`SEO_MAKE_MODELS` in `src/lib/seo.ts` is the canonical list of combos that have a page
(`generateStaticParams` maps over it; the route 404s on unknown combos and on live count 0).
`resolveMakeModelFamily` matches a listing's `make` (case-insensitive contains, same as the DB
`.ilike('make', %make%)`) and `model` against the combo's `modelPattern` (ilike → JS regex) while
excluding `notModelPattern` — identical semantics to `countMakeModel`. A card link is only rendered
when a combo resolves. Because a card only renders for an active listing, any resolved combo has
≥1 active listing, so its page cannot 404 on the count-0 guardrail.

## Acceptance criteria (QA grades against these)
1. `/aircraft/[make]/[model]` shows breadcrumbs Home › Aircraft for Sale › {Make} {Model}; each
   crumb except the last is a working `<a>`/`<Link>` that navigates correctly; styled sky-blue.
2. `/aircraft` shows breadcrumbs Home › Aircraft for Sale (last crumb current page).
3. At least one for-sale card shows a "See all {Make} {Model} for sale" link that resolves to a
   real `/aircraft/[make]/[model]` page returning HTTP 200 (spot-check it does NOT 404).
4. No link is emitted for a listing whose make+model is not in `SEO_MAKE_MODELS`.
5. `npx next build` + typecheck pass; no console/hydration errors on the production build.
6. No horizontal overflow at 375px on `/aircraft` and `/aircraft/[make]/[model]`.

## Out of scope (DEFER to later slices)
- Family→family rails (slice 2). NOTE: the make+model page already has a "Browse other aircraft
  for sale" rail; not expanding it here.
- Nearby-airport cross-links (slice 3).
- Breadcrumbs on partnerships/airports pages (those already have inline crumbs; not refactoring
  them this slice to keep scope tight).
- Any schema/DB change. Additive only.
