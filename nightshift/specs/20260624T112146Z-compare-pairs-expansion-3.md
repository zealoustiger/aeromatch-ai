# compare-pairs-expansion-3

## Goal
Extend the curated `/aircraft/compare/[slug]` family with three more genuinely-unique
head-to-head pages targeting the high-volume "{model} vs {model}" buyer query class,
bringing four classic-trainer / sporty-single matchups online and spreading crawl
equity from the model seed hubs into the new pages (STAGE=INDEXING, [goal] lane).

## The three new pairs (all curated on BOTH sides — verified against seo.ts)
1. **Cessna 172 vs Grumman AA-5** (`cessna-172-vs-grumman-aa-5`) — the ubiquitous
   trainer vs the sporty sliding-canopy four-seater (both fixed-gear 180 hp).
2. **Grumman AA-5 vs Piper Cherokee** (`grumman-aa-5-vs-piper-cherokee`) — two
   fixed-gear 180 hp four-seaters: speed (AA-5) vs load + support (PA-28).
3. **Cessna 150 vs Piper Cub** (`cessna-150-vs-piper-cub`) — the practical nosewheel
   two-seat trainer vs the iconic fabric tailwheel classic.

## Scope (one file)
- `src/lib/aircraftComparisons.ts` — append 3 entries to `COMPARISONS` (slug, a/b refs,
  unique intro, 3 FAQs each). DATA ONLY. Every spec figure already lives in the curated
  `MODEL_SPECS`/`MODEL_HIGHLIGHTS` (cessna/172, grumman/aa-5, piper/cherokee, cessna/150,
  piper/cub) — no fabricated numbers, no live counts.

## Acceptance criteria
- [ ] 3 new entries added; `COMPARISONS` length 18 → 21; build + typecheck green.
- [ ] All 3 new pages render at `/aircraft/compare/<slug>` (HTTP 200) with a full
      two-column spec table, both highlights blocks, intro, Browse-for-sale CTAs, and FAQ.
- [ ] Each page's FAQPage JSON-LD matches its 3 visible Q&As 1:1.
- [ ] All 3 slugs appear in `sitemap.xml` and on the `/aircraft/compare` index.
- [ ] Model hubs for the 5 involved models show the new "Compare the {model}" links
      (via `comparisonsForModel`).
- [ ] QA smoke (production `next start`) exit 0 on the compare index + all 3 new pages
      at desktop 1280 + mobile 375 (HTTP 200, zero app-origin console errors, zero overflow).

## Out of scope
- No new route, component, schema, or dependency.
- No changes to existing comparison entries or the page templates.
- No ClubHanger-Estimate price row (deferred per prior cycle notes).
