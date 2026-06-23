# Spec — home-forsale-make-links

**Lane:** `[goal]` (last non-bug cycle `similar-rails-snap-carousel` pulled `[want]`;
last cycle PASS so no blocker → `[goal]` owed per the 1:1). STAGE=INDEXING.

## Goal
Add internal links from the homepage (the site's highest-authority page) to the
**aircraft-for-sale make hubs** — the #1 search-demand family (`{make} {model} for sale`)
— which the homepage currently does not link to at all (it only links the *partnership*
make/state hubs). This opens a clean homepage→for-sale-family crawl path, the #2
INDEXING lever after backlinks.

## Why this grows pageviews
- Per the keyword research, **make+model + "for sale"** is the top demand pattern and
  `aircraft for sale {state}` is the single top autocomplete — but the homepage surfaces
  only partnership SEO links. The for-sale programmatic family (`/aircraft/[make]` →
  model pages, plus `/aircraft/browse`) gets no link equity from `/`.
- Internal linking from the highest-authority page is the strongest on-site INDEXING
  lever available without backlinks. Each make hub then fans crawl out to its model
  and state pages.

## Scope (small, additive, static)
- `src/app/page.tsx` only. Add ONE new SEO section, "Browse aircraft for sale by make,"
  mirroring the existing "Browse partnerships by aircraft make" section:
  - 8 curated `SEO_MAKES` → `/aircraft/[make]` (link text "{Make} aircraft for sale").
    All 8 resolve to real hubs with live inventory (`resolveMake`), so no 404 risk.
  - A "Browse all aircraft for sale →" link to `/aircraft/browse` (the all-families hub).
- Pure static internal links — **no DB query, no async, no new dependencies** → zero
  TTFB/CWV impact (keeps parity with the existing static partnership SEO sections).

## Acceptance criteria
- [ ] Homepage renders a new "Browse aircraft for sale by make" section with all 8
      `SEO_MAKES`, each linking to `/aircraft/<slug>` (e.g. `/aircraft/cessna`).
- [ ] Section includes a "Browse all aircraft for sale" link to `/aircraft/browse`.
- [ ] Existing homepage sections (partnership make/state, guides/tools, FAQ, rails)
      are unchanged.
- [ ] `npx next build` + typecheck pass.
- [ ] QA smoke (HTTP 200, no app-origin console errors, no horizontal overflow at
      1280 + 375) passes on `/`; screenshots look right.

## Out of scope
- A for-sale **by-state** homepage section (the state pages 404 on zero inventory, so
  safe linking needs a per-state inventory query — deferred to avoid making `/` async).
- Any change to the for-sale pages themselves, or to the partnership sections.
- New page families.
