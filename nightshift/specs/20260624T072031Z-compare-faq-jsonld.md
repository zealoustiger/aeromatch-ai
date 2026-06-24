# Spec — Comparison-page FAQs + FAQPage JSON-LD (`compare-faq-jsonld`)

**Lane:** [goal] (last non-bug cycle `post-type-toggle` pulled [want]; last cycle PASS → no blocker → [goal] owed per the 1:1). STAGE = INDEXING.

## Goal
Add a genuine, curated per-pair **FAQ section** + matching **FAQPage JSON-LD** to the
curated aircraft comparison pages (`/aircraft/compare/[comparison]`), giving the family
unique on-page content depth and rich-result eligibility — the explicit "Next" the
`aircraft-compare-pages` cycle recorded ("FAQ/structured data once a comparison-appropriate
schema is settled"). Pure page-quality / structured-data work on an existing indexable
family (INDEXING lever), no new pages.

## Scope (small)
- `src/lib/aircraftComparisons.ts` — add an optional `faqs: { q; a }[]` field to the
  `Comparison` type and author 3 genuine, evergreen, NON-FABRICATED Q&As for each of the
  8 curated pairs (drawn from the existing `intro` + both sides' `MODEL_SPECS`/
  `MODEL_HIGHLIGHTS` — no invented figures, no live counts, so the copy never goes stale).
- `src/app/aircraft/compare/[comparison]/page.tsx` — render the visible FAQ (reuse the
  existing `ModelFaq` component) and emit `buildFaqPageJsonLd(c.faqs, { url })`, matching
  the visible text 1:1 (Google parity), placed before the "More comparisons" block.

## Acceptance criteria
- Each curated comparison page renders a visible "… — frequently asked questions" section
  with 3 honest Q&As specific to that pair.
- Each page emits exactly one `FAQPage` JSON-LD `<script>` whose questions/answers match
  the visible FAQ 1:1 (no drift; built from the same `c.faqs` source).
- No fabricated statistics or live listing counts in any answer; figures cited match the
  existing curated spec tables.
- `npx next build` + typecheck pass; QA smoke (desktop 1280 + mobile 375) is HTTP 200,
  zero app-origin console errors, zero horizontal overflow on the affected pages.
- Existing comparison content (intro, spec table, highlights, cross-links, CTAs) is
  unchanged.

## Out of scope
- New comparison pairs (no new pages this cycle — INDEXING stage favors quality over breadth).
- ClubHanger-Estimate price-context row (separate future slice).
- Any change to the model hub, sitemap, or other families.
