# Spec — Per-state FAQ blocks + FAQPage JSON-LD on for-sale state pages

**Slug:** `forsale-state-faq`
**Lane:** `[goal]` (owed — last non-bug cycle `partnerships-filter-chips` was `[want]`).
**STAGE:** INDEXING — unique content depth + rich-result eligibility on existing pages.

## Goal
Give the for-sale geo pages `/aircraft/for-sale/[state]` a genuine, evergreen
"Frequently asked questions" section (3 buying-focused Q&As) plus valid `FAQPage`
JSON-LD — extending the proven FAQ pattern (per-model → per-make for-sale →
partnership-make → partnership-state) to the for-sale **state** family, which targets
the #1 autocomplete query pattern (`aircraft for sale california`).

## Scope (small, additive)
- `src/lib/seo.ts` — add a `FORSALE_STATE_FAQS` map keyed by lowercase USPS code
  (curated high-GA states: ca/tx/fl/az/co/wa, mirroring the partnership-state set) +
  a `getForSaleStateFaqs(code)` helper. Answers are **buying-focused** (where to look,
  what to check, what affects price in that state) — intentionally distinct from the
  co-ownership-focused `PARTNERSHIP_STATE_FAQS`.
- `src/app/aircraft/for-sale/[state]/page.tsx` — import `getForSaleStateFaqs` +
  `buildFaqPageJsonLd` + the existing `ModelFaq` accordion; emit the `FAQPage`
  JSON-LD `<script>` and render `<ModelFaq>` below the listings, only when curated.

## Acceptance criteria
- [ ] Curated for-sale state pages (ca/tx/fl) render a visible FAQ accordion with 3
      buying-focused Q&As below the listings.
- [ ] Each curated page emits exactly one `FAQPage` JSON-LD block whose answer text
      matches the visible accordion 1:1 (Google parity).
- [ ] A non-curated but in-inventory state (e.g. one not in the 6) renders NO FAQ and
      is otherwise unchanged (no templated boilerplate across all 50 states).
- [ ] No fabricated stats / no live counts → content never goes stale.
- [ ] `next build` + `tsc --noEmit` green (modulo the 4 pre-existing `.test.ts` errors).
- [ ] QA smoke exit 0 at desktop 1280 + mobile 375 on ca/tx/fl (HTTP 200, zero
      app-origin console errors, zero horizontal overflow); screenshots look right.

## Out of scope
- Curating all 50 states (would risk thin/templated boilerplate).
- Per-make+model+state FAQ variants (`/aircraft/[make]/[model]/[state]`) — a later slice.
- Any schema/DB/SQL, new component, new color, or new dependency.
