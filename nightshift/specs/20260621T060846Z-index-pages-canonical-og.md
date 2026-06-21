# index-pages-canonical-og

## Goal
Finish the sitewide canonical + OpenGraph sweep by bringing the two remaining priority INDEX pages — `/partnerships` (#3) and `/aircraft` (#2) — up to the same SEO metadata bar the homepage already has: a self-canonical plus a complete page-level `openGraph` (url/title/description + image/site_name/type/locale) and a `twitter` summary_large_image block. Metadata-only; nothing a visitor sees changes.

## Scope (files expected to touch — small)
- `src/app/partnerships/page.tsx` — add `alternates.canonical: '/partnerships'` (currently NONE) + full page-level `openGraph` + `twitter` block.
- `src/app/aircraft/page.tsx` — keep existing `alternates.canonical: '/aircraft'`, add the missing full page-level `openGraph` (url/title/description + image/site_name/type/locale) + `twitter` block.
- Reuse existing constants from `@/lib/seo` only: `SITE_URL`, `SITE_NAME`, `DEFAULT_OG_IMAGE`. No new component/color/dependency.

## Acceptance criteria (QA grades against these)
1. Served HTML of `/partnerships` carries a self-canonical `<link rel="canonical" href=".../partnerships">` (was missing entirely) and `/aircraft` keeps its `<link rel="canonical" href=".../aircraft">`.
2. Both pages' served HTML carries a populated `og:url`, `og:title`, `og:description`, `og:image` (+ width/height/alt), `og:site_name`, `og:type=website`, `og:locale` — none empty.
3. Both pages carry a `twitter:card=summary_large_image` + twitter:title/description/image.
4. All existing JSON-LD on each page still parses (no regressions); `npx next build` + `tsc --noEmit` pass (no new errors vs the pre-existing `.test.ts` baseline).
5. No new console / hydration errors; zero horizontal overflow at 375px; both pages render visually unchanged at desktop 1280 + 375px.

## Out of scope
- Any visible/content/layout change; no edit to `layout.tsx` (metadataBase already set there).
- The make/state/model families' `openGraph.url` parity (a later cycle).
- Any JSON-LD addition, new schema, DB/SQL, or new component/color/dependency.
