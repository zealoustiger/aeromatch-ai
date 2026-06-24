# Spec — compare-pairs-expansion-2

## Goal
Add five more curated head-to-head `/aircraft/compare/[a-vs-b]` pages targeting the
high-volume "{model} vs {model}" buyer query class, built entirely from existing
curated `MODEL_SPECS` + `MODEL_HIGHLIGHTS` (no fabricated figures), extending the
proven comparison family from 13 → 18 pairs.

## Lane
`[goal]` — last non-bug cycle `partnership-filter-multi-airport` pulled `[want]`;
last cycle PASS → no blocker → `[goal]` owed per the 1:1. STAGE=INDEXING; this spreads
crawl equity from indexed model seed hubs into a real, unique indexable family.
Explicit "Next" queued by `compare-pairs-expansion`.

## Scope
- `src/lib/aircraftComparisons.ts` only — append 5 entries to `COMPARISONS`.
- Everything else (route `generateStaticParams`, compare index, sitemap, model-hub
  "Compare the {model}" blocks, cross-links) derives from `COMPARISONS`, so no other
  file changes.

## The five pairs (both sides have curated specs+highlights — verified)
1. `cessna-182-vs-beechcraft-bonanza` — high-wing fixed-gear hauler vs retractable traveler.
2. `mooney-m20-vs-piper-comanche` — two efficient four-seat retractables.
3. `piper-saratoga-vs-cessna-182` — six-seat hauler vs four-seat hauler step-up.
4. `cessna-180-vs-cessna-182` — tailwheel backcountry Skywagon vs nosewheel Skylane.
5. `piper-cub-vs-bellanca-citabria` — the two classic two-seat taildraggers.

## Acceptance criteria
- 5 new entries appended to `COMPARISONS`; each `a`/`b` resolves via `getMakeModel`
  (so the spec table + highlights render on both sides).
- Each entry has a unique, factual `intro` and exactly 3 `faqs` whose visible answers
  match the FAQPage JSON-LD 1:1 — all figures trace to the dumped curated specs, none
  invented, no live counts (so copy never goes stale).
- `npx next build` + typecheck green; all 5 new slugs appear in `sitemap.xml`.
- QA smoke (production `next start`) exit 0 on the compare index + a sample of the new
  pages at desktop 1280 + mobile 375 (HTTP 200, zero app-origin console errors, zero
  horizontal overflow); screenshots read and confirmed correct.

## Out of scope
- No new models, no schema/DB change, no new dependency, no route changes.
- No combinatorial auto-generation (`dynamicParams=false` stays; curated list is the
  single source of truth).
