# Partnership make-level FAQ blocks + FAQPage JSON-LD

## Goal
Add 3 genuine, evergreen, co-ownership-focused Q&As + valid FAQPage JSON-LD to each
of the 8 curated `/partnerships/make/[make]` hub pages (cessna, piper, cirrus,
beechcraft, mooney, diamond, vans, grumman — priority pages #5/#6/#7 among them) to
deepen unique content and earn rich-result eligibility in the INDEXING stage.

## Scope (small, additive)
- `src/lib/seo.ts` — add a `PARTNERSHIP_MAKE_FAQS` map keyed by make slug + a
  `getPartnershipMakeFaqs(slug)` helper (mirrors `MAKE_FAQS`/`resolveMake`).
- `src/app/partnerships/make/[make]/page.tsx` — render the existing `ModelFaq`
  component with the partnership FAQs and emit a `buildFaqPageJsonLd` script.
- Reuse existing `ModelFaq.tsx` + `buildFaqPageJsonLd` (no new component/helper file).

## Acceptance criteria
- Each of the 8 curated partnership make pages renders a visible FAQ accordion with 3
  partnership/co-ownership-specific Q&As (distinct from the for-sale make FAQs).
- Each page emits one FAQPage JSON-LD block whose questions/answers match the visible
  DOM text 1:1 (Google parity); answers are plain prose, no fabricated stats, no live
  counts → never goes stale.
- A make NOT in the curated set (none currently, but defensively) renders no FAQ.
- The existing ItemList JSON-LD, breadcrumb, cards, header, and cross-links are unchanged.
- `npx next build` + typecheck pass; QA smoke exit 0 at desktop 1280 + mobile 375 with
  no app-origin console errors and no horizontal overflow.

## Out of scope
- For-sale make pages (already shipped 2026-06-22T00:08Z).
- Per-state FAQ variants; partnership model-level FAQs.
- Any schema/DB/SQL change, new color, or new dependency.
