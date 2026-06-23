# Guide pages: add Article structured data (JSON-LD)

## Goal
Give every editorial guide page a valid `Article` (schema.org) structured-data block, so
Google recognizes the 7 guides — including the priority-seed `/guides/aircraft-co-ownership`
(#12) — as substantive editorial articles (E-E-A-T / enhanced-presentation eligibility).

## Why this grows pageviews (leading indicator, STAGE=INDEXING)
The guides already emit FAQPage + BreadcrumbList JSON-LD but carry **no Article markup**.
Article is the recognized structured-data type for content/informational pages; adding it is
a leading-indicator INDEXING win (richer machine understanding of the pillar pages, reinforced
content-quality signals), not a tonight-pageview play. Pure additive metadata — no visible/UX change.

## Scope (small)
- New helper `src/lib/guideJsonLd.ts` — `buildArticleJsonLd({ title, description, path })`
  returning an `Article` object (headline/description/url/mainEntityOfPage/image/author/publisher/
  inLanguage). Mirrors the repo's existing JSON-LD builder pattern (`aircraftJsonLd.ts`).
- The 7 guide pages under `src/app/guides/*/page.tsx` — import the helper and emit one extra
  `application/ld+json` `<script>` (built from each page's existing `TITLE`/`DESCRIPTION`/`PATH`
  constants). No other change to any guide.

## Acceptance criteria
- [ ] Each of the 7 guides renders a second `application/ld+json` block of `"@type":"Article"`
      in the served production HTML, alongside the existing FAQPage + BreadcrumbList blocks.
- [ ] `headline`/`description`/`url` exactly mirror the page's own `<h1>`/meta/canonical (no
      claim the page doesn't show); `headline` ≤ 110 chars (Google's Article limit).
- [ ] `publisher` + `author` are the ClubHanger Organization with a logo ImageObject.
- [ ] No fabricated `datePublished`/`dateModified` (we have no honest timestamp — omit, per the
      sitemap's honesty rule), no fabricated author person.
- [ ] `next build` + typecheck green; qa-smoke exit 0 (HTTP 200, zero app-origin console errors,
      zero horizontal overflow) at desktop 1280 + mobile 375 on the guides.
- [ ] Pages render visually unchanged (structured data only, no DOM/layout change).

## Out of scope
- No visible content / layout / copy changes on any guide.
- No new guide pages, no sitemap change (guides already in sitemap).
- No HowTo schema (Google deprecated HowTo rich results) — Article only.
- No changes to the aircraft/partnership JSON-LD.
