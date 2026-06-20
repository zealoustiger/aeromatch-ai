# Spec — tools-sitemap-seo

**Lane [goal]** — the [P1][goal] "Sitemap + canonical sweep" backlog item applied to
the brand-new `/tools*` routes shipped by the prior cycle (calculators-nav-jsonld).

## Goal
Make the three `/tools*` pages (`/tools`, `/tools/cost-calculator`,
`/tools/earnings-calculator`) cleanly indexable — complete the breadcrumb +
internal-linking gap so crawlers reach all three and each emits a BreadcrumbList.

## Audit (what already exists — do NOT duplicate)
- **Sitemap:** all three `/tools*` routes are already in `src/app/sitemap.ts`
  (lines 13–15). No change needed — verified, not assumed.
- **Hub `/tools`:** already has unique `title` + `meta description` + self-`canonical`
  + OpenGraph, a `<Breadcrumbs>` trail (Home › Tools) that already emits BreadcrumbList
  JSON-LD, `CollectionPage`/`ItemList` JSON-LD, and crawlable `<Link>`s DOWN to both
  calculators. No change needed.
- **Both calculators:** already have unique `title` + `meta description` + self-`canonical`
  + OpenGraph + `SoftwareApplication` JSON-LD (from the prior cycle). Cost links to
  Earnings and vice-versa. **Do NOT touch metadata or JSON-LD here.**
- **robots.txt:** `/tools` is NOT in the disallow list — already crawlable. Verified.

## The genuine gap (the only thing this cycle adds)
Neither calculator page renders `<Breadcrumbs>`, so:
1. Neither emits a **BreadcrumbList** (Home › Tools › <Calculator>) — the task asks for one per page.
2. Neither has a crawlable internal **up-link back to the `/tools` hub** — the hub→calculator
   loop is one-directional today (calculator only links sideways to the other calculator).

Fix: add the shared `<Breadcrumbs>` component (already used by `/tools` and the rest
of the site) to the top of each calculator page with items
`Home › Tools (→/tools) › <Calculator name>`. This single change delivers both the
BreadcrumbList JSON-LD AND the crawlable hub up-link, closing the internal-link loop.

## Scope (files — keep small)
- `src/app/tools/cost-calculator/page.tsx` — add `<Breadcrumbs>` (Home › Tools › Cost calculator).
- `src/app/tools/earnings-calculator/page.tsx` — add `<Breadcrumbs>` (Home › Tools › Earnings calculator).

## Acceptance criteria (QA grades against these)
1. All three `/tools*` URLs appear in the served `/sitemap.xml` from the running PRODUCTION server.
2. Each of the three pages serves a unique `<title>`, unique `<meta name="description">`,
   and a self-referential `<link rel="canonical">` (verified unchanged/correct).
3. Each of the three pages emits a valid `BreadcrumbList` JSON-LD trail
   (`/tools` = Home › Tools; each calculator = Home › Tools › <Calculator>), all parsing as JSON.
4. Each calculator page renders a crawlable `<a href="/tools">` (the breadcrumb up-link),
   so the hub↔calculator internal-link loop is bidirectional.
5. `/tools*` is NOT disallowed in the served `/robots.txt`.
6. No new console/hydration errors at desktop (1280) or mobile (375px); no horizontal
   overflow at 375px; sky-blue accent preserved.

## Out of scope
- Any metadata, OG, canonical, or SoftwareApplication/CollectionPage JSON-LD change
  (already correct — do not re-touch).
- Sitemap changes (routes already present).
- robots.txt changes (already correct).
- Any schema/DB/SQL change (NONE needed).
- New copy, new tools, layout redesign, or nav changes.
