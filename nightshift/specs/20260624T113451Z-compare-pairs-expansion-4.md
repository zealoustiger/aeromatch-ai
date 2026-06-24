# compare-pairs-expansion-4

## Goal
Add three more curated head-to-head aircraft comparison pages to the existing
`/aircraft/compare/[a-vs-b]` family, each targeting a real high-volume "{model} vs
{model}" buyer query and built entirely from already-curated MODEL_SPECS +
MODEL_HIGHLIGHTS (no new/fabricated figures).

## Lane
`[goal]` — SEO breadth, STAGE=INDEXING. Deliberate fall-through: the prior non-bug
cycle (`compare-pairs-expansion-3`) was `[goal]`, so `[want]` was owed, but the
`[want]` lane is blocked — its substantive remaining items need a human-applied DB
migration (on-site messaging `messages` table; optional save-note column; seeking
multi-base-airport) or transactional-email infra, and every clean no-schema want
(post-type tabs, seeking autosave, filter promotion, save-search auto-name,
detail-page cost/price-history/estimate, card pills) is already shipped. Per
GOAL.md ("if the chosen lane is empty, fall through to the other"), this is `[goal]`.

## Scope
- `src/lib/aircraftComparisons.ts` — append 3 entries to the `COMPARISONS` array:
  1. `cirrus-sr20-vs-cessna-172` — entry-level glass/parachute single vs the trainer
  2. `beechcraft-bonanza-vs-piper-saratoga` — two 300 hp travelers (speed vs cabin/load)
  3. `mooney-m20-vs-piper-arrow` — two 200 hp retractables (efficiency vs load)
- Everything else auto-derives from that array (verified): `generateStaticParams`
  (`dynamicParams = false`), `sitemap.ts`, the `/aircraft/compare` index, and the
  model-hub cross-links via `comparisonsForModel`. No other files change.

## Acceptance criteria
- The 3 new pages render HTTP 200 with a full two-column spec table + highlights on
  both sides, a unique editorial intro, and a 3-question FAQ + FAQPage JSON-LD.
- All numeric claims in each intro/FAQ match the curated MODEL_SPECS 1:1 (no
  fabricated figures; verified against seo.ts: SR20 215 hp/~155 kt, 172 180 hp/~124 kt,
  Bonanza 300 hp/~174 kt, Saratoga 300 hp/~160 kt, M20 200 hp/~160 kt, Arrow 200 hp/~137 kt).
- The 3 new slugs appear on the `/aircraft/compare` index and in `sitemap.xml`.
- `npx next build` + typecheck pass; QA smoke (desktop 1280 + mobile 375) exits 0 with
  no app-origin console errors and no horizontal overflow; screenshots look right.
- 21 → 24 curated pairs.

## Out of scope
- No new MODEL_SPECS/MODEL_HIGHLIGHTS (no new model families, no new numbers).
- No price-context row, no design changes to the comparison template.
- No price-bucket / combinatorial pages (GOAL.md thin-page guardrail).
