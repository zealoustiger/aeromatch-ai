# Spec — compare-pairs-expansion

## Goal
Expand the existing `/aircraft/compare/[comparison]` family with 5 new curated
head-to-head pairs (the explicit "Next" queued by the `aircraft-compare-pages`
cycle), broadening this real, indexable family into 4 currently-uncompared popular
models — Mooney M20, Beechcraft Baron, Piper Comanche, Cessna 150 — to capture more
high-volume "{model} vs {model}" buyer queries (STAGE=INDEXING, [goal] lane).

## Scope (small — one data file)
- `src/lib/aircraftComparisons.ts` — append 5 entries to the `COMPARISONS` array:
  1. `mooney-m20-vs-cirrus-sr22`
  2. `mooney-m20-vs-beechcraft-bonanza`  ← explicit Next
  3. `piper-comanche-vs-piper-arrow`     ← explicit Next
  4. `beechcraft-bonanza-vs-beechcraft-baron`
  5. `cessna-150-vs-cessna-172`
- No other files: the route's `generateStaticParams`, the `/aircraft/compare` index,
  `sitemap.ts`, and the per-model-hub "Compare the {model}" cross-links all already
  derive from `COMPARISONS`, so the new pages, sitemap entries, and internal links
  appear automatically.

## Acceptance criteria
- All 5 new pages render HTTP 200 with a full two-column spec table + both models'
  highlights (every model already has curated `MODEL_SPECS` + `MODEL_HIGHLIGHTS`).
- Each new entry has a unique, non-fabricated `intro` and exactly 3 genuine FAQs whose
  figures match the existing `MODEL_SPECS` (no invented numbers, no live counts).
- The visible FAQ accordion text matches the emitted FAQPage JSON-LD 1:1 (shared array).
- The 5 new slugs appear in `/sitemap.xml` and on the `/aircraft/compare` index.
- The model-hub pages for the newly-added models show a "Compare the {model}" block.
- `npx next build` + typecheck pass; QA smoke (desktop 1280 + mobile 375) is clean
  (200 / no app console errors / no horizontal overflow) and screenshots look right.

## Out of scope
- No new components, routes, schema, or styling changes.
- No combinatorial auto-generation — the curated slug list stays the single source of
  truth (`dynamicParams = false`), so no thin/duplicate pages.
- No changes to the existing 8 comparison pairs.
