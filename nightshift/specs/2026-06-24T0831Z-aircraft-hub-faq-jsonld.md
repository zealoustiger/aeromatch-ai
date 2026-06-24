# Spec — aircraft-hub-faq-jsonld

**Lane:** [goal] (last non-bug cycle `seeking-form-autosave` pulled [want]; last cycle PASS → no blocker → [goal] owed per the 1:1). STAGE=INDEXING — deepen the quality + structured data of the 12 priority seed pages, not just add new ones.

## Goal
Add a unique evergreen "About buying aircraft on ClubHanger" explainer + a "frequently asked questions" section (visible accordion + matching FAQPage JSON-LD) to the `/aircraft` for-sale hub (priority seed page #2, the #2-trafficked page), the explicit "Next" queued by the `partnerships-hub-faq-jsonld` cycle.

## Scope
- `src/app/aircraft/page.tsx` — one file. Add a curated `AIRCRAFT_OVERVIEW` (×3 paragraphs) + `AIRCRAFT_FAQS` (×5), render the overview in an "About buying aircraft on ClubHanger" panel + the FAQs via the existing `<ModelFaq>` below the listings, and emit one `FAQPage` JSON-LD via the existing `buildFaqPageJsonLd`. Mirrors the just-shipped `/partnerships` hub pattern exactly.

## Acceptance criteria
- `npx next build` + `tsc --noEmit` green (no new errors in the touched file).
- Exactly **1** FAQPage JSON-LD block in the served HTML, with **5** Question entries whose text matches the 5 visible `<summary>` questions 1:1.
- The pre-existing ItemList + AggregateOffer JSON-LD on `/aircraft` are preserved (still present).
- 3 unique evergreen paragraphs + 5 on-page Q&As render cleanly below the existing content at desktop 1280 + mobile 375; no horizontal overflow, no console errors.
- No fabricated stats / no live counts in the copy (evergreen, stays accurate). No new page, no schema/DB change, no new deps.

## Out of scope
- Any change to the filters, listings, chip bar, cross-sell, mission/compare link blocks, or existing JSON-LD.
- FAQ on the remaining seed pages (`/tools/earnings-calculator` etc.) — separate cycles.
- Any new fields, routes, or sitemap changes.
