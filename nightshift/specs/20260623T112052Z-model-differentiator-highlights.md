# Per-model "what's different about this model" highlights

**Slug:** `model-differentiator-highlights`
**Lane:** `[want]` (last non-bug cycle `aircraft-hub-aggregateoffer-jsonld` pulled `[goal]`; no blocker → `[want]` owed per the 1:1)
**Backlog item:** `[P2][want] Model pages: richer specs + per-model differentiators` — the queued
"Remaining: per-model 'what's different' differentiator blurb" follow-up to the shipped `model-spec-tables`.

## Goal
Give each curated make+model for-sale page a short, scannable "What's different about the
{Make} {Model}" highlights card — 3 concise, accurate bullets distilling what genuinely sets
that model apart — so a buyer comparing families gets the decision-useful gist at a glance,
distinct from the long "About" prose and the spec table.

## Scope (small)
- `src/lib/seo.ts`: add a `MODEL_HIGHLIGHTS` record (3 bullets per curated family, the same 8
  families that already have `MODEL_SPECS`), an optional `highlights?: string[]` field on
  `SeoMakeModel`, and attach it in `getMakeModel` alongside `faqs`/`overview`/`specTable`.
- `src/app/aircraft/[make]/[model]/page.tsx`: render the highlights card (bulleted list) right
  after the key-specs table, before the "About the {label}" prose.
- (optional) a tiny unit assertion that every `MODEL_HIGHLIGHTS` key also exists in `MODEL_SPECS`.

## Acceptance criteria
- The 8 curated families (cessna 172/182/150, cirrus sr22/sr20, piper cherokee/arrow,
  beechcraft bonanza) each render a "What's different about the {label}" card with 3 real,
  non-fabricated differentiator bullets.
- A non-curated / dynamically-discovered combo renders **no** highlights card (no fabrication).
- The card sits between the spec table and the "About" prose, styled like the sibling cards
  (`rounded-xl border border-slate-200 bg-white`), and reads cleanly at 375px and 1280px.
- `npx next build` + typecheck pass; QA smoke (HTTP 200, no app console errors, no horizontal
  overflow at 1280 + 375) passes on a curated and a non-curated model page; screenshots look right.

## Out of scope
- No new routes, no schema, no DB reads.
- No spec-table expansion to more families (separate queued slice).
- No changes to dynamic-combo pages beyond them continuing to render nothing.
