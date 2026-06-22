# Spec — seeking-content-depth

## Goal
Make `/partnerships/seeking` (priority seed page #4, flagged "thin/blank; needs real
content to be index-worthy") substantively index-worthy by adding unique, evergreen
content depth — an "About pilots seeking partnerships" prose section + a curated FAQ
with FAQPage JSON-LD — without fabricating any seeker data.

## Lane
`[goal]` — content depth + structured data on a priority seed page during STAGE=INDEXING.
Last non-bug cycle (partnerships-token-sweep) pulled `[want]`, so `[goal]` is owed (1:1).

## Scope (small)
- `src/app/partnerships/seeking/page.tsx` — add two module-scope const arrays
  (overview paragraphs + FAQ Q&As), render an "About" prose `<section>` and a
  `<ModelFaq>` block, and emit `buildFaqPageJsonLd(...)` script. Reuse existing
  components/helpers (`ModelFaq`, `buildFaqPageJsonLd`) and the page's existing
  white/slate card styling. No data/query/schema change.

## Acceptance criteria
1. `/partnerships/seeking` renders a new "About pilots seeking aircraft partnerships"
   prose section (3 genuine, evergreen paragraphs — no fabricated stats, no live counts).
2. The page renders a visible FAQ accordion (5 genuine evergreen Q&As) via the shared
   `ModelFaq` component, distinct in wording from the prose.
3. A single valid `FAQPage` JSON-LD block is present in the served HTML, its questions/
   answers matching the visible FAQ text 1:1.
4. Existing behavior unchanged: metadata/canonical/OG, breadcrumbs, the Available/Seeking
   tabs, the seeker list + empty-state (available-partnerships rail), and the existing
   cross-links all still render.
5. `npx next build` + `tsc --noEmit` green (no new errors vs the 4-test baseline).
6. QA smoke PASS (HTTP 200, zero app-origin console errors, zero horizontal overflow) at
   desktop 1280 + mobile 375; screenshots look right.

## Out of scope
- Seeding real/derived seeker listings (the FAA-registry item — needs human legal review).
- Any visual/token reskin of the page (that's the separate `[want]` token-sweep slice).
- Changing the seeker query, schema, or the empty-state logic.
