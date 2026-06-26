# Spec: model-curate-cessna-206

**Timestamp:** 2026-06-25T08:19:05Z  
**Slug:** model-curate-cessna-206  
**Lane:** [goal] — SEO breadth + quality (INDEXING stage)

## Goal

Upgrade `/aircraft/cessna/206` from a thin, auto-generated count-only page to a fully curated one — adding a key-specs table, "what's different" highlights, an "About the Cessna 206" editorial overview, and a 3-question FAQ (visible + FAQPage JSON-LD). This is the same template successfully applied to Cessna 172, 182, 150, 180, 210 (all shipped), and is the most-cited uncurated high-inventory Cessna family in prior cycle notes.

## Scope

Single file: `src/lib/seo.ts`

- Add `cessna/206` entry to `SEO_MAKE_MODELS` array
- Add `'cessna/206'` to `MODEL_SPECS` (key-specs table: 6 entries)
- Add `'cessna/206'` to `MODEL_HIGHLIGHTS` (3 bullets)
- Add `'cessna/206'` to `MODEL_FAQS` (3 genuine evergreen Q&As)
- Add `'cessna/206'` to `MODEL_OVERVIEWS` (2 editorial paragraphs)

No component, no schema, no sitemap code change — the page is already generated via `getInventoryMakeModels()` and will pick up curated content via `getMakeModel()` once the data entries are added.

## Acceptance criteria

1. `/aircraft/cessna/206` returns HTTP 200 with no console errors.
2. Page renders the **key-specs table** (Seats, Engine, Horsepower, Cruise, Range, Useful load, Fuel, Gear).
3. Page renders the **"What's different about the Cessna 206"** highlights block (3 bullets).
4. Page renders the **"About the Cessna 206 Stationair"** section (2 prose paragraphs).
5. Page renders the **FAQ accordion** (3 questions, visible text).
6. `<script type="application/ld+json">` contains FAQPage structured data matching the visible FAQ text 1:1.
7. All content is genuine/accurate — no fabricated figures, no live listing counts.

## Out of scope

- No new pages or routes
- No Cessna 310 curation this cycle (separate cycle)
- No changes to partnership pages, sitemap, or other makes
- No DB schema changes
