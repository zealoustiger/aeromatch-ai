# Spec — homepage `/` canonical + OpenGraph (priority page #1, INDEXING)

## Goal
Bring the homepage `/` (priority page #1) up to the make-page on-page-SEO bar by adding a self-canonical and a complete page-level OpenGraph/Twitter block (closing the two verified audit gaps: `/` has no canonical, and `og:url` is empty), plus a `logo` on the WebSite/Organization JSON-LD so the homepage is fully index-worthy.

## Scope (small)
- `src/app/page.tsx` — extend the existing `export const metadata` with:
  - `alternates: { canonical: '/' }` (resolves against `metadataBase` → self-canonical `https://clubhanger.com/`)
  - `openGraph: { url: '/', title, description }` (so `og:url` is populated + a homepage-specific OG title/desc, layering over the layout defaults which already supply siteName/type/locale/image)
  - `twitter: { title, description }` (layout already supplies card + image)
  - add `logo: \`${SITE_URL}/og-default.png\`` to the existing `websiteSchema` (WebSite JSON-LD) — real asset that exists in `public/`.
- No other files. No layout edit (keeps the change scoped to `/`, avoids sitewide risk).

## Acceptance criteria
1. Served HTML for `/` contains `<link rel="canonical" href="https://clubhanger.com/">` (self-canonical, absolute).
2. Served HTML contains a non-empty `og:url` pointing at the canonical homepage URL, plus `og:title` and `og:description` (homepage-specific), and the inherited `og:image` (og-default.png) + `og:site_name` + `og:type=website` remain present.
3. Served HTML contains `twitter:title` + `twitter:description` and the inherited `twitter:card=summary_large_image` + image.
4. The existing WebSite + FAQPage JSON-LD still parse; the WebSite JSON-LD now carries a `logo`; the SearchAction (sitelinks search box) is unchanged.
5. `npx next build` + `tsc --noEmit` pass (no new errors in touched file).
6. QA against the PRODUCTION build at desktop 1280 + 375px: homepage renders unchanged visually, zero new console errors / hydration warnings, zero horizontal overflow at 375px.

## Out of scope
- No layout.tsx / sitewide og:url change (the Organization schema in layout stays as-is).
- No `/partnerships` (#3) or `/aircraft` (#2) canonical work this cycle (noted as next).
- No visual/content change to the homepage. No new component, color, dependency, or any schema/DB/SQL change.
