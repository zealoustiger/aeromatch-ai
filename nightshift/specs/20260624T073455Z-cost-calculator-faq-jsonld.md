# cost-calculator-faq-jsonld

**Lane:** [goal] (last non-bug cycle `seeking-description-help` pulled [want]; last cycle PASS → no blocker → [goal] owed per the 1:1). STAGE=INDEXING.

## Goal
Deepen the quality of the `/tools/cost-calculator` **priority seed page** (GOAL.md #11) by adding a genuine, evergreen "frequently asked questions" section plus matching **FAQPage** structured data, making it eligible for Google's rich FAQ results on high-intent "how much does an aircraft partnership cost / cheaper than renting" queries — using the same proven `ModelFaq` + `buildFaqPageJsonLd` pattern already live on the make/state/seeking/compare pages.

## Scope (small)
- `src/app/tools/cost-calculator/page.tsx` only:
  - Add a curated `COST_FAQS` array (5 Q&As) written from the page's own existing explanations (no fabricated figures, no live counts → never goes stale).
  - Render it via the existing `<ModelFaq>` component below the "How to read these numbers" prose.
  - Emit one `FAQPage` JSON-LD via the existing `buildFaqPageJsonLd`, with the visible text matching 1:1.

## Acceptance criteria
- `npx next build` + `tsc --noEmit` green (no new errors in the touched file vs. the pre-existing `.test.ts` baseline).
- `/tools/cost-calculator` renders the FAQ accordion below the existing prose, styled consistently (ModelFaq), at desktop 1280 + mobile 375 with **zero** horizontal overflow and **zero** app-origin console errors (qa-smoke exit 0).
- Exactly one `FAQPage` JSON-LD block is present with 5 `Question` entries, and each `acceptedAnswer.text` matches the visible answer 1:1.
- The existing SoftwareApplication JSON-LD, metadata/canonical/OG, breadcrumbs, calculator widget, "How to read these numbers" prose, and internal links are all unchanged.
- No new form fields, no schema change, no new dependencies.

## Out of scope
- Changing the calculator logic/inputs or any other tool page.
- Adding new internal-link blocks or restyling the page.
- Any FAQ on non-seed pages this cycle.
