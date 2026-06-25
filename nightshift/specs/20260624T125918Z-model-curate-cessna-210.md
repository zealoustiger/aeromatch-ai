# Spec — model-curate-cessna-210

## Goal
Upgrade the thin, auto-generated `/aircraft/cessna/210` page into a fully curated,
genuinely-unique make+model page (the proven Diamond/Cessna template) — the
highest-inventory uncurated model family on the site (Cessna 210 Centurion: ~10
priced / 11 active real listings) — to lift it from templated boilerplate to
index-worthy quality in the INDEXING stage.

## Why (goal lane)
- `[goal]` lane (last non-bug cycle `seeker-filter-multi-airport` pulled `[want]`).
- STAGE=INDEXING → enriching an existing, already-crawlable URL with unique content
  + FAQPage JSON-LD is the highest-leverage indexing move (page quality), not a new
  thin page. Diversifies off the heavily-worked compare-pairs family (per its own
  "DIVERSIFY" note) and continues the queued "curate the next-highest-inventory
  uncurated make+model family" follow-up from the Diamond curation cycles.
- The Cessna 210 Centurion is a famous, evergreen model — content can be written from
  well-known general-aviation facts with zero fabrication. It is the natural retractable
  sibling of the already-curated Cessna 172/180/182/150 family.

## Scope (small, data-only)
- `src/lib/seo.ts` ONLY:
  - Add a curated `cessna/210` entry to `SEO_MAKE_MODELS` (makeSlug `cessna`,
    modelSlug `210`, modelPattern `210%` — identical scope to the existing dynamic
    page, so no URL/listing-set change; the curated entry wins the slug+pattern
    collision and the generic dynamic copy is dropped).
  - Add `MODEL_SPECS['cessna/210']` (key-spec table — representative normally-aspirated
    variant, disclosed as representative by the existing footnote).
  - Add `MODEL_HIGHLIGHTS['cessna/210']` (3 "what's different" bullets).
  - Add `MODEL_FAQS['cessna/210']` (3 evergreen Q&As; rendered visibly AND as FAQPage
    JSON-LD 1:1).
  - Add `MODEL_OVERVIEWS['cessna/210']` (2 "About" paragraphs).
- No component changes — `page.tsx` already renders each curated section when present.

## Acceptance criteria
- `npx next build` + typecheck pass (no new errors in touched files).
- `/aircraft/cessna/210` renders: curated specs/cost-to-own, **key-specifications
  table**, **"What's different about the Cessna 210"** highlights, **About the Cessna
  210** prose, and a **3-question FAQ**, plus its real live listings (count > 0).
- Exactly one `"@type":"FAQPage"` JSON-LD on the page, with 3 Q/3 A matching the 3
  visible FAQ items 1:1.
- The page keeps its unique title/canonical (`/aircraft/cessna/210`) and stays in the
  sitemap (it already is, via `getInventoryMakeModels`). No duplicate/second URL.
- QA smoke exit 0 on `/aircraft/cessna/210` at desktop 1280 + mobile 375 (HTTP 200,
  zero app-origin console errors, zero horizontal overflow); screenshots look right.
- All content is genuine/evergreen — no fabricated statistics (spec figures are
  representative, per the page's existing disclosure footnote), no live counts in copy.

## Out of scope
- No new comparison pages / aircraftComparisons.ts changes.
- No curation of the turbo/pressurized (T210/P210) or other uncurated families.
- No component/layout/styling changes; no schema; no sitemap code change.
