# guides-twitter-og-parity

## Goal
Bring the six non-flagship `/guides/[article]` pages up to full Open Graph + Twitter-card
metadata parity with the rest of the site, so shared links render a rich preview card and
search engines get complete, consistent machine-readable metadata.

## Lane
[goal] — last non-bug CHANGELOG cycle (`partnership-seo-alert-capture`) pulled [want]; last
cycle PASS so no blocker → [goal] owed per the 1:1. STAGE=INDEXING: complete, consistent
OG/Twitter metadata across the content cluster is a leading-indicator win (richer machine
understanding + shareable cards that can earn links/visits driving indexing). This is the
directly-queued "Next" from the `content-hub-twitter-parity` cycle.

## Scope (files — metadata blocks only)
- `src/app/guides/cost-of-aircraft-co-ownership/page.tsx`
- `src/app/guides/how-to-find-aircraft-partners/page.tsx`
- `src/app/guides/leaseback-vs-co-ownership/page.tsx`
- `src/app/guides/aircraft-pre-purchase-inspection/page.tsx`
- `src/app/guides/aircraft-partnership-agreement/page.tsx`
- `src/app/guides/aircraft-title-escrow-and-closing/page.tsx`

Each change: (1) extend the `@/lib/seo` import to also pull `SITE_NAME, DEFAULT_OG_IMAGE`;
(2) add `siteName` + `images` to the existing `openGraph` block; (3) add a `twitter`
`summary_large_image` block — mirroring the already-shipped flagship `aircraft-co-ownership`
guide exactly. Reuse each page's existing per-page OG description for the twitter description.

## Acceptance criteria
- All six guide pages emit `twitter:card=summary_large_image`, `twitter:title`,
  `twitter:description`, and `twitter:image` in served HTML (previously absent).
- All six emit `og:image` (1200×630), `og:site_name`, `og:url`, and `og:type=article`.
- `npx next build` + typecheck pass (no new errors beyond the pre-existing `.test.ts` baseline).
- qa-smoke exit 0 (HTTP 200, zero app-origin console errors, zero horizontal overflow) at
  desktop 1280 + mobile 375 on the affected guide pages.
- No visible change to the pages (head-only metadata) — screenshots render exactly as before.

## Out of scope
- The visible body content / layout of any guide.
- The `/guides` hub and `aircraft-co-ownership` flagship (already have full parity).
- Per-page dynamic OG images, sitemap changes, JSON-LD changes.
