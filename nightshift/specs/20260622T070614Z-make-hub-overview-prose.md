# Spec — Unique "About {Make}" overview prose on make hub pages

**Slug:** `make-hub-overview-prose`
**Lane:** `[goal]` (owed — last non-bug cycle `soft-save-merge-on-login` was `[want]`; last cycle PASSed, no blocker)
**Backlog item:** `[P1][goal] Unique content depth on programmatic pages` (Brainstorm 2026-06-20, section A) — "Each make/model/state page gets genuinely unique prose (model history, what it's good for, typical price range in words) so it isn't templated boilerplate Google skips. No fabricated stats. Slice by family."

## Goal
Add a genuinely-unique, evergreen "About {Make}" prose section (2 short paragraphs of real brand history + lineup positioning) to the 8 curated `/aircraft/[make]` hub pages, so each make hub carries unique editorial content depth instead of a one-line templated header — making them more index-worthy in the INDEXING stage.

## Why this grows pageviews (leading indicator)
STAGE=INDEXING. Templated, count-only headers are the kind of thin boilerplate Google deprioritizes. Genuine, unique narrative prose on the make hubs (priority pages #5/#6/#7 = cessna/cirrus/piper among them) raises page quality and gives crawlers real content to index. Judged on the leading indicator (unique evergreen prose live on 8 hub pages), not tonight's pageview delta.

## Scope (small)
- `src/lib/seo.ts` — add an `overview?: string[]` field to the `SeoMake` type; add a `MAKE_OVERVIEWS` map (8 curated makes, 2 short paragraphs each); attach it in `resolveMake` exactly the way `MAKE_FAQS` is attached (non-mutating spread; non-curated makes get none).
- `src/app/aircraft/[make]/page.tsx` — render an "About {Make}" section (the `overview` paragraphs) when present, placed below the per-model breakdown and above the listings.

## Acceptance criteria
1. Each of the 8 curated makes (cessna, piper, cirrus, beechcraft, mooney, diamond, vans, grumman) renders an "About {Make}" section with 2 distinct, genuine, evergreen paragraphs — no fabricated statistics, no live listing counts, no keyword stuffing.
2. The prose is distinct from the existing per-make FAQ (`MAKE_FAQS`) — narrative overview, not Q&A near-duplicate.
3. A make with inventory but no curated overview (if any exists) renders NO "About" section (graceful, like the FAQ pattern) — the page is otherwise unchanged.
4. `npx next build` + `tsc --noEmit` pass (no new errors in touched files).
5. QA smoke (`qa-smoke.mjs`) exit 0 on representative make pages at desktop 1280 + mobile 375: HTTP 200, zero app-origin console errors, zero horizontal overflow; screenshots look right.
6. No new component / color / dependency; NO schema / DB / SQL change.

## Out of scope
- Model-level (`/aircraft/[make]/[model]`) or state-level prose (separate future slices).
- Partnership make pages.
- Any JSON-LD change (overview prose is editorial body copy, not structured data).
- Touching the header copy, breakdown list, listings, FAQ, or cross-links.
