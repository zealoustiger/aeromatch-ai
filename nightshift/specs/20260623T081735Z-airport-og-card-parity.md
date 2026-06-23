# airport-og-card-parity

**Lane:** `[goal]` (last non-bug cycle `clubhanger-estimate-detail` pulled `[want]`, last cycle PASS so no blocker → `[goal]` owed per the 1:1). STAGE=INDEXING.

## Goal
Bring the airport detail page (`/airports/[icao]`) OpenGraph/Twitter metadata up to
parity with every other programmatic family — add `og:url`, `og:type`, `og:siteName`,
`og:image`, and a Twitter summary-large-image card — so shared airport links render a
proper card (referral traffic) and the family matches the site-wide metadata pattern.

## Why this grows pageviews
Airport pages are a heavy internal-linking crawl hub (the human "really likes" them).
Today they emit only `og:title`/`og:description` — no image, no `og:url`, no Twitter
card — while `/aircraft`, `/aircraft/[make]`, `/aircraft/[make]/[model]`,
`/aircraft/for-sale/[state]`, `/partnerships/make/[make]`, and `/partnerships/state/[state]`
all carry the full set. This is the "add explicit `openGraph.url` to the families for
parity" item from the canonical/OG sweep, plus shareability — a leading-indicator
INDEXING-stage win (richer, consistent metadata; shareable cards), not a tonight-pageview play.

## Scope (files)
- `src/app/airports/[icao]/page.tsx` — expand the `openGraph` block in `generateMetadata`
  and add a `twitter` block. Import `SITE_NAME` + `DEFAULT_OG_IMAGE` from `@/lib/seo`
  (alongside the existing `SITE_URL`).

## Acceptance criteria
- The airport page `openGraph` now includes `url` (absolute, lowercased ICAO),
  `type: 'website'`, `siteName: SITE_NAME`, and `images: [{ url: DEFAULT_OG_IMAGE, … }]`
  in addition to the existing `title`/`description`.
- A `twitter` block (`card: 'summary_large_image'`, title, description, images) is added,
  matching the other family pages.
- The non-indexable thin-airport guard (`robots: { index: false, follow: true }`) is
  preserved unchanged.
- `npx next build` + typecheck pass.
- QA smoke (desktop 1280 + mobile 375) on an indexable airport page passes: HTTP 200,
  no app-origin console errors, no horizontal overflow; screenshots look right.

## Out of scope
- No visual/layout change to the rendered page (metadata only).
- No change to canonical, JSON-LD, or the thin-page indexability logic.
- No change to any other route family.
