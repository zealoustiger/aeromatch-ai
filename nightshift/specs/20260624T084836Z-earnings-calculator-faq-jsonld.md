# Spec — earnings-calculator-faq-jsonld

## Goal
Add a curated, evergreen FAQ section + matching FAQPage structured data to
`/tools/earnings-calculator`, the only remaining tool/seed-adjacent page that still
lacks FAQ — bringing it to parity with its sibling `/tools/cost-calculator` (which
got the same treatment) and the make/state/partnerships/aircraft seed pages.

## Scope (small, additive)
- `src/app/tools/earnings-calculator/page.tsx` only.
  - Import `ModelFaq` + `buildFaqPageJsonLd` (already used by cost-calculator).
  - Add a curated `EARNINGS_FAQS` array (5 owner-side Q&As), written from this page's
    own explanations — no fabricated figures, no live counts.
  - Build one `FAQPage` JSON-LD via `buildFaqPageJsonLd` and emit it; render the same
    Q&As visibly via `<ModelFaq>` so the visible text matches the JSON-LD 1:1.

## Acceptance criteria
- `npx next build` + typecheck pass (no new errors in the touched file).
- Served HTML for `/tools/earnings-calculator` contains exactly 1 `FAQPage` block and
  5 `Question` entries, and the pre-existing `SoftwareApplication` JSON-LD is preserved.
- 5 visible `<summary>` accordion items render below the existing "How the offset works"
  prose; every visible question matches the JSON-LD 1:1.
- qa-smoke exit 0 on `/tools/earnings-calculator` at desktop 1280 + mobile 375 (HTTP 200,
  zero app-origin console errors, zero horizontal overflow).
- Screenshots read and confirmed: FAQ renders cleanly, no 375px overflow/layout break.

## Out of scope
- The calculator widget, the existing prose, metadata, breadcrumbs, internal links — untouched.
- No new fields, no schema/DB change, no new deps.
