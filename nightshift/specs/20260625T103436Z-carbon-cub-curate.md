# Spec: Carbon Cub model page curation

**Timestamp:** 20260625T103436Z  
**Slug:** carbon-cub-curate  
**Lane:** [goal] SEO breadth + quality

## Goal
Upgrade the dynamically-discovered `/aircraft/cubcrafters/carbon` page from generic, copy-free auto-generated content to a fully curated entry: a key-specifications table, three "what's different" highlights, two editorial overview paragraphs, and a 3-question FAQ (rendered visibly + FAQPage JSON-LD). Same proven pattern as the cessna/210, cessna/206, cessna/421 curation cycles.

## Why this grows pageviews
The CubCrafters Carbon Cub is one of the most searched modern STOL aircraft (buyers search "Carbon Cub for sale", "CubCrafters EX-3", "Carbon Cub FX-3") — high intent, high price point, distinct brand. Currently has 10 active priced listings ($50k+ floor), so the page already renders via dynamic discovery, but with no specs, no highlights, no FAQs — purely generic placeholder copy. Curating it adds unique content depth for INDEXING and makes the page genuinely useful to buyers comparing STOL options.

## Scope
Files touched: `src/lib/seo.ts` only (data addition, same as model-curate-cessna-421).

Changes:
1. Add `cubcrafters/carbon` entry to `SEO_MAKE_MODELS` (makeSlug, modelSlug, make, model, modelPattern, specs, costToOwn)
2. Add `cubcrafters/carbon` to `MODEL_SPECS` (key specifications table, 6–8 rows)
3. Add `cubcrafters/carbon` to `MODEL_HIGHLIGHTS` (3 differentiator bullets)
4. Add `cubcrafters/carbon` to `MODEL_FAQS` (3 FAQ Q&As)

No component, schema, sitemap, or route change needed — the make+model page already exists via dynamic discovery; the curated entry in SEO_MAKE_MODELS promotes it to a curated page with real editorial depth.

## Acceptance criteria
- [ ] `/aircraft/cubcrafters/carbon` returns HTTP 200 and no console errors
- [ ] Page renders key-specs table with ≥ 6 rows
- [ ] Page renders "What's different" highlights (3 bullets)
- [ ] Page renders "About the CubCrafters Carbon Cub" editorial prose (≥ 2 paragraphs)
- [ ] Page renders FAQ accordion with 3 questions visible
- [ ] FAQPage JSON-LD emitted in `<script type="application/ld+json">` with 3 Q&As
- [ ] `npx next build` exits 0, no TypeScript errors in seo.ts
- [ ] QA smoke exit 0 on `/aircraft/cubcrafters/carbon`, `/aircraft/cubcrafters`, `/aircraft` at desktop 1280 + mobile 375

## Out of scope
- CubCrafters XCub curation (only 1 listing — below DYNAMIC_MIN_COUNT, not worth a separate page)
- Adding CubCrafters to SEO_MAKES partnership hub (no partnership listings in the DB for this make)
- Any component, schema, or sitemap change
