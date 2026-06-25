# Spec: model-curate-cessna-421

**UTC timestamp:** 2026-06-25T09:26:40Z
**Branch:** night/model-curate-cessna-421
**Lane:** [goal] — SEO breadth + quality (3 prior non-bug cycles all [want]; [goal] owed)

## Goal
Upgrade the Cessna 421 Golden Eagle model page (`/aircraft/cessna/421`) from a thin
auto-generated entry to a fully curated one, matching the pattern established for
cessna/172, 182, 150, 180, 210, and 206. The 421 has ~10 active listings (highest
inventory of any uncurated Cessna model) and is a well-documented pressurized cabin-class
twin — the most distinctive uncurated Cessna family.

## Scope
One file only: `src/lib/seo.ts`. Additions:
1. `SEO_MAKE_MODELS` — one new entry (`cessna/421`) with `specs` + `costToOwn` blurbs
2. `MODEL_FAQS['cessna/421']` — 3 curated Q&As (visible + FAQPage JSON-LD)
3. `MODEL_OVERVIEWS['cessna/421']` — 2 "About the Cessna 421" paragraphs
4. `MODEL_SPECS['cessna/421']` — 8-row key-specifications table (421C as representative variant)
5. `MODEL_HIGHLIGHTS['cessna/421']` — 3 "what's different" bullet differentiators

## Acceptance criteria
- [ ] `/aircraft/cessna/421` returns HTTP 200 and renders curated sections
- [ ] Page shows key-specs table (seats, engines, hp, cruise, range, load, fuel, gear, pressurization)
- [ ] Page shows 3-question FAQ accordion + FAQPage JSON-LD in page source
- [ ] "About the Cessna 421" prose renders with 2 distinct paragraphs
- [ ] Highlights block renders 3 "what's different" bullets
- [ ] All content is well-known, durable GA facts — no fabricated statistics, no live listing counts
- [ ] `npx next build` exits 0 with no TypeScript errors
- [ ] QA smoke passes (HTTP 200, zero app-origin console errors, zero horizontal overflow) at 1280 + 375

## Out of scope
- Cessna 310 curation (queued for a future [goal] cycle)
- sitemap changes (page already in sitemap via `getInventoryMakeModels` dynamic path)
- Any component changes (model page template already handles all curated sections)
- No schema, no new routes, no new files
