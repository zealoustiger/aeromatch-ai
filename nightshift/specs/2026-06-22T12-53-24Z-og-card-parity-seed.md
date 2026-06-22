# OG / Twitter card parity sweep — priority seed pages + airports

## Goal
Complete the Open Graph + Twitter card metadata on the priority seed pages that
still have thin OG (cost calculator, co-ownership guide) and on the airport family,
so every shared link unfurls into a real image card and carries `og:url` for
parity with the rest of the site.

## Why this grows pageviews
`[goal]` lane, STAGE=INDEXING. Two of the human's top-12 priority pages
(`/tools/cost-calculator` #11, `/guides/aircraft-co-ownership` #12) currently have
`openGraph` with only `title` + `description` (or no `images`) and **no Twitter
card** — so shared links don't unfurl with the default OG image, losing referral
clicks and breaking the consistent card treatment the rest of the families already
have. `/airports/[icao]` has the same gap. Metadata-only, additive, reversible.

## Scope (files)
- `src/app/tools/cost-calculator/page.tsx` — add `url`, `type`, `siteName`,
  `images` to `openGraph`; add `twitter` summary_large_image card.
- `src/app/guides/aircraft-co-ownership/page.tsx` — add `images` + `siteName` to
  `openGraph`; add `twitter` card.

**Dropped from scope mid-cycle:** `src/app/airports/[icao]/page.tsx` was also going
to get the same OG fields, but QA found `/airports/[icao]` returns **HTTP 500 on the
local production build of unmodified `staging`** (reproduces with the airport edit
reverted, so it is pre-existing, not caused by this cycle). The real error is masked
by a missing `_global-error` server chunk (`ChunkLoadError`). Since the page can't be
QA-verified and the bug is out of scope for this `[goal]` cycle, the airport edit was
reverted and the 500 filed as a `[P1][bug]` for a dedicated cycle.

## Acceptance criteria
- Each page's rendered HTML includes `og:image` (the site default OG image),
  `og:url` (the page's canonical absolute URL), `og:site_name`, and a
  `twitter:card=summary_large_image`.
- Canonical tags and titles/descriptions are unchanged.
- `npx next build` + typecheck pass.
- QA smoke (200 / no app console errors / no horizontal overflow) passes at 1280 + 375
  on `/tools/cost-calculator` and `/guides/aircraft-co-ownership`.

## Out of scope
- No layout/visual changes, no copy changes, no new images (reuse `DEFAULT_OG_IMAGE`).
- No new routes; no changes to sitemap/robots; no JSON-LD changes.
- Other page families already have complete OG (make/model/state) — leave them.
