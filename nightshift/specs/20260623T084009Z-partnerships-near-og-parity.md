# Spec — partnerships-near-og-parity

**Lane:** `[goal]` (SEO / metadata parity + shareability). Last non-bug cycle
`alerts-double-opt-in` pulled `[want]`; last cycle PASS so no blocker → `[goal]`
owed per the 1:1. STAGE=INDEXING.

## Goal
Bring the `/partnerships/near/[icao]` programmatic geo family up to full
OpenGraph + Twitter-card metadata parity with the rest of the site (it currently
emits only `og:title` + `og:description` — no `og:url`, `og:type`, `og:site_name`,
`og:image`, and no Twitter card at all), exactly as the previous `[goal]` cycle
`airport-og-card-parity` did for `/airports/[icao]` and explicitly queued as its
"Next".

## Scope (small — one file)
- `src/app/partnerships/near/[icao]/page.tsx` — in `generateMetadata`, expand the
  `openGraph` block (add `url`, `type: 'website'`, `siteName`, `images`) and add a
  matching `twitter` summary_large_image card. Import `SITE_NAME` +
  `DEFAULT_OG_IMAGE` from `@/lib/seo`. Reuse a single `url` const for both the
  canonical and `og:url`.

## Acceptance criteria
- A populated near-airport partnerships page (e.g. `/partnerships/near/khwd`)
  renders these tags in its HTML: `og:url`, `og:type=website`, `og:site_name`,
  `og:image` (+ width/height/alt), `twitter:card=summary_large_image`,
  `twitter:title`, `twitter:image` — matching the airport family's set.
- `og:url` equals the page canonical (`${SITE_URL}/partnerships/near/<icao>`).
- The visible page is unchanged (metadata-only change).
- The thin-page guardrail is preserved: a below-threshold / unknown ICAO still
  returns the `{ title: 'Airport not found' }` early-return and 404s the page (no
  OG tags forced onto a non-page).
- `npx next build` + typecheck green; qa-smoke exit 0 (HTTP 200, zero app-origin
  console errors, zero horizontal overflow) at desktop 1280 + mobile 375.

## Out of scope
- Any visible/layout/copy change to the page.
- A per-airport dynamic OG image (deferred — uses the default OG image, same as
  every other family).
- Touching the other 11 pages that lack Twitter cards (guides, tools hub,
  earnings-calculator, seeking, listing-quality) — separate future cycles; one
  scoped change tonight.
- robots/noindex changes (this family already 404s thin pages rather than
  noindex-ing them, so no robots block is needed — unlike `/airports/[icao]`).
