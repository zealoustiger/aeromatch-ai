# Partnership STATE hub overview prose — "Co-owning an aircraft in {State}"

**Slug:** partnership-state-overview-prose
**Lane:** [goal] — Unique content depth on programmatic pages (Brainstorm 2026-06-20 §A), slice 5.
**Stage:** INDEXING. Priority seed pages #8/#9/#10 = `/partnerships/state/ca`, `/tx`, `/fl`.

## Goal
Give each curated `/partnerships/state/[state]` hub a unique, evergreen, 2-paragraph
"Co-owning an aircraft in {State}" narrative — the co-ownership counterpart to the
for-sale "Buying an aircraft in {State}" prose — so these priority pages carry real
editorial content above the templated count-only header that Google deprioritizes
in the INDEXING stage.

## Scope (small, additive)
- `src/lib/seo.ts` — add a `PARTNERSHIP_STATE_OVERVIEWS: Record<string,string[]>` map
  (same curated set as `PARTNERSHIP_STATE_FAQS`: ca/tx/fl/az/co/wa) + a
  `getPartnershipStateOverview(code)` helper mirroring `getForSaleStateOverview`.
- `src/app/partnerships/state/[state]/page.tsx` — fetch the overview and render a
  "Co-owning an aircraft in {State}" `<section>` between the header and the listings,
  reusing the exact card styling the for-sale-state overview uses.

## Acceptance criteria
- [ ] `npx next build` + `tsc --noEmit` green (only pre-existing `.test.ts` baseline errors).
- [ ] ca/tx/fl each render a "Co-owning an aircraft in {State}" heading + 2 unique paragraphs
      in served HTML, with distinct opening lines per state.
- [ ] Prose is co-ownership-focused and deliberately distinct in wording from BOTH the page's
      `PARTNERSHIP_STATE_FAQS` AND the for-sale `FORSALE_STATE_OVERVIEWS` (not a near-duplicate).
- [ ] A non-curated state (e.g. wyoming) returns 200 with NO overview section, ItemList intact.
- [ ] NO fabricated stats, NO live listing counts (never goes stale).
- [ ] QA smoke exit 0 (HTTP 200, zero app console errors, zero horizontal overflow) at
      desktop 1280 + mobile 375 on ca/tx/fl; screenshots look on-brand.

## Out of scope
- Any new component/color/dependency, JSON-LD/schema change, or DB/SQL.
- Non-curated states, airport-page overviews, model-level prose (future slices).
- Metadata/canonical/OG changes (already correct).
