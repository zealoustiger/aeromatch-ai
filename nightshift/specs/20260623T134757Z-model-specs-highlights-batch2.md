# Spec — model-specs-highlights-batch2

## Goal
Extend the curated **key-specifications table** + **"What's different about the {Make} {Model}" highlights** to the 12 already-curated make+model families that today have overview prose, FAQs, and JSON-LD but no spec table or highlights — deepening real, unique content on those indexable `/aircraft/[make]/[model]` pages (INDEXING-stage page quality).

## Lane
`[goal]` — SEO content depth. Last non-bug cycle (`hero-for-sale-search`) pulled `[want]`; last cycle PASS → no blocker → `[goal]` owed per the 1:1. Closes the recurring "Remaining: extend MODEL_SPECS + MODEL_HIGHLIGHTS to more curated families" follow-up of the `model-spec-tables` / `model-differentiator-highlights` cycles.

## Scope (small — data only, one file)
- `src/lib/seo.ts` — add entries to the existing `MODEL_SPECS` and `MODEL_HIGHLIGHTS` records for these 12 families (all already in `SEO_MAKE_MODELS` + `MODEL_OVERVIEWS` + `MODEL_FAQS`):
  `cirrus/sr22t, mooney/m20, beechcraft/baron, piper/comanche, bellanca/citabria, vans/rv, piper/cub, cessna/180, piper/saratoga, grumman/aa-1, grumman/aa-5, robinson/r44`.
- NO page-code change: `getMakeModel` already attaches `MODEL_SPECS[key]`/`MODEL_HIGHLIGHTS[key]`, and `/aircraft/[make]/[model]/page.tsx` already renders both sections conditionally (live + already QA'd on the first 8 families).

## Acceptance criteria
- Each of the 12 make+model pages now renders a "{label} key specifications" table (8 representative rows) AND a "What's different about the {label}" 3-bullet card, between the existing spec/cost cards and the "About" prose.
- Spec figures are real, well-documented representative figures for a popular variant of each family, consistent with the already-published `MODEL_OVERVIEWS` prose; the existing "representative variant" footnote covers variant variation (no fabricated precision).
- The 8 pre-existing curated families (cessna 172/182/150, cirrus sr22/sr20, piper cherokee/arrow, beechcraft bonanza) are unchanged.
- A dynamically-discovered (non-curated) combo still renders NO spec table and NO highlights.
- `npx next build` + typecheck green; qa-smoke exit 0 (HTTP 200, no app-origin console errors, no horizontal overflow) at desktop 1280 + mobile 375 on a sample of the new pages.

## Out of scope
- No new make+model families, routes, or DB work.
- No change to the rendering/page component, JSON-LD helpers, or the footnote.
- No edits to the existing 8 curated tables.
