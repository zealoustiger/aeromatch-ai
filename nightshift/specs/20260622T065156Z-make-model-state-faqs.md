# Per-make+model+state FAQ blocks + FAQPage JSON-LD on `/aircraft/[make]/[model]/[state]`

**Lane:** `[goal]` (last non-bug cycle `soft-save-local-fallback` was `[want]`; last cycle PASSed, no blocker → `[goal]` is owed). STAGE=INDEXING.

## Goal
Add genuine, evergreen, intersection-specific FAQ blocks + valid `FAQPage` structured data to a small curated set of high-intent `/aircraft/[make]/[model]/[state]` pages, extending the proven per-model / per-make / per-state FAQ pattern to the make+model+state combo level (the #1 search pattern, e.g. "cessna 172 for sale california").

## Scope (small)
- `src/lib/seo.ts` — add a `MAKE_MODEL_STATE_FAQS` map keyed by `makeSlug/modelSlug/stateCode` + a `getMakeModelStateFaqs(makeSlug, modelSlug, code)` helper (mirrors `getForSaleStateFaqs`). Curated combos only.
- `src/app/aircraft/[make]/[model]/[state]/page.tsx` — resolve the combo's FAQs, emit `FAQPage` JSON-LD (via existing `buildFaqPageJsonLd`), and render the existing `ModelFaq` accordion. No FAQ when the combo isn't curated.

Curated set (all confirmed ≥3 live listings at orient, so the page renders): `cessna/172/ca`, `cessna/172/tx`, `cirrus/sr22/ca`, `cirrus/sr22/tx`, `cirrus/sr22/fl`, `cessna/182/tx`. 3 Q&As each, combining model traits + state GA scene/costs/conditions — intentionally distinct from the model-only `MODEL_FAQS` and the generic-buying `FORSALE_STATE_FAQS`.

## Acceptance criteria
- A curated combo page (e.g. `/aircraft/cessna/172/california`) renders a visible FAQ accordion with 3 model+state-specific Q&As.
- That page's served HTML contains exactly one `FAQPage` JSON-LD block whose 3 questions/answers match the visible accordion text 1:1 (Google parity).
- A non-curated combo page that still has inventory (e.g. `/aircraft/cessna/182/washington`) renders NO FAQ section and emits NO `FAQPage` markup; its existing ItemList/AggregateOffer JSON-LD is unchanged.
- No fabricated stats, no live counts in the FAQ copy (evergreen / never stale).
- `npx next build` + typecheck pass; QA smoke exits 0 at desktop 1280 + mobile 375 (HTTP 200, no app-origin console errors, no horizontal overflow); screenshots look right.

## Out of scope
- No new component, color, dependency, route, or param.
- No schema/DB/SQL change.
- No change to the model-only or state-only FAQ sets, or to non-FAQ page content.
- Not curating every combo — only the marquee high-inventory intersections (no boilerplate across all combos).
