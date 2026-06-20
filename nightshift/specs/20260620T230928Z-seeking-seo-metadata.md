# Spec — seeking-seo-metadata

## Goal
Bring `/partnerships/seeking` (priority page #4, flagged thin/blank) up to the same indexing bar as the make/state priority pages by adding the missing on-page SEO: self-canonical + OpenGraph, a crawlable breadcrumb trail (BreadcrumbList JSON-LD), ItemList JSON-LD for the partnerships the page surfaces, and a cross-link block to the partnership hub families.

## Why this grows search traffic (STAGE=INDEXING)
This is the weakest of the 12 priority pages: it has a title/description but NO canonical, NO OG, NO JSON-LD, NO breadcrumbs, and NO outbound internal links — so it is a near dead-end for crawlers and ineligible for rich results. The make pages (`/partnerships/make/[make]`) already do all of this; this cycle copies that established, honest pattern onto the seeking page. Leading indicators: valid unique metadata + self-canonical, structured data on the page, and new internal links spreading crawl.

## Scope (small)
- `src/app/partnerships/seeking/page.tsx` — add canonical + OG to metadata; render `<Breadcrumbs>` (Home › Partnerships › Seeking); pass surfaced partnerships' ItemList JSON-LD; add a "Browse partnerships" cross-link block at the bottom.
- `src/components/SeekerList.tsx` — surface the partnerships it already fetches so the page can emit matching ItemList JSON-LD (mirror the make page: markup matches visible cards 1:1, real data only). Smallest change: have the seeking page fetch the same `getLatestPartnerships(N)` and render the available-partnerships rail + ItemList itself, OR export the list. Keep the existing `SeekerList` behavior intact when real seekers exist.

Reuse existing helpers only: `Breadcrumbs`, `buildPartnershipItemListJsonLd`, `getLatestPartnerships`, `SITE_URL`, `DEFAULT_OG_IMAGE`. NO new component, NO schema/DB/SQL change, NO new color.

## Acceptance criteria
1. `/partnerships/seeking` served HTML contains a self-canonical `<link rel="canonical" href="https://.../partnerships/seeking">` and OpenGraph tags (og:title, og:description, og:url, og:image).
2. A visible, crawlable breadcrumb trail renders (Home › Partnerships › Seeking) with real `<a>` links to `/` and `/partnerships`, and emits valid `BreadcrumbList` JSON-LD.
3. When the page surfaces available partnerships (the common empty-seeker case), it emits an `ItemList` JSON-LD whose items match the rendered partnership cards 1:1 and each `url` points at a real `/partnerships/[id]`. No fabricated ratings/offers (honesty rule).
4. A bottom cross-link block links to `/partnerships`, `/partnerships/make/{cessna,cirrus,piper}` (or the make hub) so the page is no longer an internal dead-end.
5. `npx next build` + typecheck pass; QA at desktop + 375px shows no horizontal overflow and zero new console/hydration errors; existing CTA ("+ Post Seeking Listing") + tabs still work.

## Out of scope
- Seeding real `partnership_seekers` rows (data work, [want] lane, needs human approach decision).
- Touching any other of the 12 priority pages.
- Changing `/partnerships` (parent) metadata, the tabs component, or any styling/branding beyond reusing existing utilities.
- Any schema/DB/SQL change.
