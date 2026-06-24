# partnerships-hub-faq-jsonld

## Goal
Deepen the index-worthiness of the **`/partnerships` hub (priority seed page #3)** by adding a unique, evergreen "About aircraft partnerships" prose section plus a genuine FAQ accordion that emits matching FAQPage structured data — making the page's core query intent ("aircraft partnership / co-ownership") substantively richer for the INDEXING stage.

## Lane
`[goal]` — last non-bug CHANGELOG cycle (`post-partnership-autosave`) pulled `[want]`; last cycle PASS → no blocker → `[goal]` owed per the 1:1. INDEXING stage: deepen quality of the 12 priority seed pages, not just add new ones. Reuses the proven `ModelFaq` + `buildFaqPageJsonLd` pattern already live on the make/state/seeking/compare/cost-calculator seed pages — `/partnerships` (seed #3) was the top-3 seed page still missing FAQ structured data.

## Scope
- `src/app/partnerships/page.tsx` only — add:
  - a curated `PARTNERSHIPS_OVERVIEW` (3 evergreen paragraphs, no fabricated stats / no live counts) rendered in an "About aircraft partnerships" panel below the listings;
  - a curated `PARTNERSHIPS_FAQS` (5 genuine Q&As) rendered via the existing `<ModelFaq>` accordion;
  - one `FAQPage` JSON-LD via the existing `buildFaqPageJsonLd`, matching the visible FAQ 1:1.
- Existing ItemList JSON-LD, metadata/canonical/OG, header, tabs, chip bar, filters, listings, and cross-sell are all untouched.

## Acceptance criteria
- `npx next build` + `tsc --noEmit` green (no new errors beyond the pre-existing `.test.ts` baseline); `/partnerships` keeps its current render mode.
- The served `/partnerships` HTML contains exactly **one** `FAQPage` JSON-LD block whose questions/answers match the visible `<summary>` accordion items 1:1 (5 of each), and the pre-existing ItemList JSON-LD is preserved.
- A visible "About aircraft partnerships" prose section (3 paragraphs) and the FAQ accordion render below the listings at both desktop 1280 and mobile 375.
- All FAQ/overview copy is evergreen — no fabricated numbers, no live listing counts.
- qa-smoke exit 0 on `/partnerships` at desktop 1280 + mobile 375 (HTTP 200, zero app-origin console errors, zero horizontal overflow); screenshots look right.

## Out of scope
- No new pages, no schema/DB change, no new dependencies.
- No changes to filters, listings query, ItemList JSON-LD, or page layout above the new sections.
- No changes to other seed pages (earnings-calculator / `/aircraft` FAQ are follow-ups).
