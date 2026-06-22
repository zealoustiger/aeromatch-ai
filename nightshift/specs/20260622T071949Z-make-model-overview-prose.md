# Unique content depth — slice 2: "About the {Make} {Model}" prose on make+model pages

## Goal
Give each of the 20 curated `/aircraft/[make]/[model]` for-sale pages a genuinely
unique 2-paragraph "About the {Make} {Model}" editorial section (model history +
positioning + why it's commonly co-owned), to lift them above templated,
count-only boilerplate that Google deprioritizes in the INDEXING stage.

## Scope (small, additive)
- `src/lib/seo.ts`: add `overview?: string[]` to `SeoMakeModel`; add a
  `MODEL_OVERVIEWS` map keyed `makeSlug/modelSlug`; attach it in `getMakeModel`
  (mirrors how `faqs` is attached). Non-curated/dynamic combos get nothing.
- `src/app/aircraft/[make]/[model]/page.tsx`: render the "About the {label}"
  section (mirrors the make-hub "About {Make}" card from slice 1), placed below
  the specs/cost-to-own cards and above the market snapshot.

## Acceptance criteria
- Each of the 20 curated make+model pages renders a 2-paragraph "About the
  {Make} {Model}" section with unique, model-specific prose (distinct from the
  specs/costToOwn blurbs and the Q&A `MODEL_FAQS` on the same page).
- No fabricated statistics, no live listing counts in the prose (never stale).
- A dynamically-discovered (non-curated) combo renders NO About section (graceful).
- `npx next build` + typecheck pass.
- QA smoke (prod build) exits 0 on 3 sample model pages at 1280 + 375; the
  About section appears in served HTML and looks right in screenshots.
- No new component/color/dependency; NO schema/DB/SQL change; no JSON-LD change.

## Out of scope
- Model-level FAQ changes (already shipped), JSON-LD changes.
- Prose on dynamic/non-curated combos, state pages, partnership pages (later slices).
- Any layout/styling change beyond the one additive section.
