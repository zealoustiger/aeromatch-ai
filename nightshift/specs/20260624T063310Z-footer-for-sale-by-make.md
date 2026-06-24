# Spec — footer-for-sale-by-make

## Goal
Add an "Aircraft for sale by make" link list to the sitewide Footer so every page on
the site carries crawlable internal links into the #1-search-demand for-sale make hubs
(`/aircraft/[make]`), closing a real asymmetry (the footer already links partnerships by
state and by make, but nothing on the aircraft-for-sale side).

## Why this grows pageviews (STAGE=INDEXING)
The footer renders on every page. Adding for-sale make-hub links there distributes crawl
budget + link equity from every page into the for-sale family — a pure internal-linking
INDEXING win. Mirrors the existing homepage "Browse aircraft for sale by make" block,
which already treats `SEO_MAKES` slugs as real, inventory-backed hubs (every slug resolves
via `resolveMake`) — so the links are static, need no DB query, and carry no 404 risk.

## Scope
- `src/components/Footer.tsx` — add an "Aircraft for sale by make" heading + list of
  `SEO_MAKES.slice(0, 6)` links to `/aircraft/${slug}`, placed in the existing makes column
  beside the current "Partnerships by make" list. No new imports beyond what's already there
  (`SEO_MAKES` is already imported).

## Acceptance criteria
- Footer renders a new "Aircraft for sale by make" heading with 6 make links, each to
  `/aircraft/[slug]` (e.g. `/aircraft/cessna`), using the same `SEO_MAKES` source the
  homepage by-make block uses.
- The existing footer links (Explore, Tools, Guides, Partnerships by state, Partnerships by
  make, Company) are all unchanged and still present.
- `next build` + typecheck pass clean.
- QA smoke (production build) exits 0 on `/` and at least one deep page (`/aircraft`) at
  desktop 1280 + mobile 375 — HTTP 200, zero app-origin console errors, zero horizontal
  overflow. Footer looks correct in the screenshots on both viewports.

## Out of scope
- Aircraft-for-sale **by state** in the footer (static state links carry 404 risk — the
  `/aircraft/for-sale/[state]` route 404s on zero inventory; that family needs the
  inventory-gated pattern, not a static footer list). Note as a follow-up.
- Any layout/redesign of the footer beyond adding the one list.
- Touching the homepage or any other page.
