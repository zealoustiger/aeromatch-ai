# Spec — content-hub-twitter-parity

## Goal
Bring the guides/tools content & utility cluster hub pages to OG/Twitter-card
metadata parity with the rest of the site so they produce rich social cards and
carry complete, valid Open Graph metadata for crawlers — the explicitly-queued
[goal] OG/Twitter parity follow-up (CHANGELOG 2026-06-23T08:40Z "Next:" line).

## Lane
[goal] (last non-bug cycle `home-deals-rail` pulled [want]; last cycle PASS → no
blocker → [goal] owed per the 1:1). STAGE=INDEXING — completing valid, consistent
metadata on the content cluster (incl. priority seed-adjacent guides/tools pages)
is a leading-indicator win, not a tonight-pageview play.

## Scope (small, metadata-only)
- `src/app/guides/page.tsx` — add `twitter` summary_large_image card; add
  `openGraph.images` + `siteName`.
- `src/app/tools/page.tsx` — add `openGraph.url` + `type` + `siteName` + `images`;
  add `twitter` card.
- `src/app/tools/earnings-calculator/page.tsx` — add `openGraph.url` + `type` +
  `siteName` + `images`; add `twitter` card.
- `src/app/listing-quality/page.tsx` — add `openGraph.images` + `siteName`; add
  `twitter` card.

Reuse the existing `DEFAULT_OG_IMAGE` + `SITE_NAME` exports from `@/lib/seo`
(same convention the state/airport/partnership families already use).

## Acceptance criteria
- All four pages export a `twitter` object with `card: 'summary_large_image'`,
  a title, a description, and `images: [DEFAULT_OG_IMAGE]`.
- All four pages' `openGraph` includes `url` (absolute), `type`, `siteName`, and
  `images` pointing at `DEFAULT_OG_IMAGE`.
- No visible/rendered change to any page (metadata-only) at desktop 1280 + mobile 375.
- `npx next build` + typecheck pass; QA smoke exit 0 (HTTP 200, no app console
  errors, no horizontal overflow) on the four routes.

## Out of scope
- The 6 non-flagship guide articles + `/guides/[slug]` (a separate family — note in Next).
- Any on-page/visible content, layout, or copy change.
- Per-page dynamic OG images (deferred idea).
- Canonical/JSON-LD changes (already present and correct on these pages).
