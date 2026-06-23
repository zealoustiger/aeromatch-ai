# Spec — Model spec tables (richer specs on make+model SEO pages)

**Slug:** model-spec-tables · **UTC:** 2026-06-22T13:39:35Z · **Lane:** [want] (last non-bug cycle `forsale-state-content` pulled [goal]; alternate to [want])

## Goal
Give the curated `/aircraft/[make]/[model]` pages a scannable **"key specifications"
table of real, public-domain figures** (seats, engine, horsepower, cruise speed,
range, useful load, fuel, gear), so the #1-search-pattern SEO pages carry genuinely
unique, factual content depth instead of only a one-line prose spec.

## Why (backlog + goal)
- Backlog `[P2][want]` "Model pages: richer specs + per-model differentiators."
- These pages are the priority seed set (#5–#7) and the top search pattern
  (make+model "for sale"). STAGE=INDEXING → unique, substantive on-page content
  is a leading-indicator win (anti-thin-page, scannable facts users actually want).

## Scope (small)
- `src/lib/seo.ts` — add optional `specTable?: { label: string; value: string }[]`
  to `SeoMakeModel`; add a `MODEL_SPECS` record of real, representative figures for
  the top ~8 curated models; merge it onto curated entries in `getMakeModel`
  (mirrors how `faqs`/`overview` are attached — curated combos only).
- `src/app/aircraft/[make]/[model]/page.tsx` — render a full-width "key
  specifications" card (mirrors the existing market-snapshot card) when
  `entry.specTable` exists, with an honest "representative figures, varies by
  variant" footnote.

## Models covered this cycle (confident, well-documented, high-inventory)
cessna/172, cessna/182, cessna/150, cirrus/sr22, cirrus/sr20, piper/cherokee,
piper/arrow, beechcraft/bonanza.

## Acceptance criteria
- [ ] `npx next build` + typecheck green.
- [ ] Curated covered pages (e.g. `/aircraft/cessna/172`, `/aircraft/cirrus/sr22`)
      render the key-specs table with the real figures + the representative footnote.
- [ ] A curated page NOT in `MODEL_SPECS` and a dynamic combo render no spec table
      (no fabricated specs, no empty card) and still return 200.
- [ ] qa-smoke exit 0 (HTTP 200, zero app console errors, zero horizontal overflow)
      at desktop 1280 + mobile 375 on at least two covered pages.
- [ ] Figures are honest/representative (footnote states variant variance); no
      fabricated precision, no keyword stuffing.

## Out of scope
- No spec-table JSON-LD (visible content only this cycle).
- No specs for dynamically-discovered combos (would require fabricating data).
- No layout/metadata changes elsewhere; no schema/DB/SQL.
