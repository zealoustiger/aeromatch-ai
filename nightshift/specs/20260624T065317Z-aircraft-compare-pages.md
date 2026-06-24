# Spec — aircraft-compare-pages

## Goal
Launch a new quality indexable page family — head-to-head aircraft comparison pages
(`/aircraft/compare/{a}-vs-{b}`) — that targets the very high-volume "{model} vs
{model}" buyer query class with real, substantively-unique side-by-side content built
entirely from existing curated data (no fabrication), and that internally links the
already-indexed model seed pages into the new family (an INDEXING-stage crawl win).

## Lane
`[goal]` — invented SEO experiment (appended to BACKLOG Ideas as `[agent]`). Last
non-bug cycle (`post-seeking-frictionless`) pulled `[want]`; last cycle PASS → no
blocker → `[goal]` owed per the 1:1. STAGE=INDEXING.

## Scope (small, additive, mostly new files)
- **New** `src/lib/aircraftComparisons.ts` — a hand-curated `COMPARISONS` list (8 high-
  intent pairs, both sides already having `MODEL_SPECS` + `MODEL_HIGHLIGHTS`), each with a
  unique 2–3 sentence editorial intro, plus `getComparison(slug)` / `comparisonsForModel()`
  helpers. No fabricated figures — specs/highlights come from the existing curated tables.
- **New** `src/app/aircraft/compare/[comparison]/page.tsx` — the detail page:
  `dynamicParams = false` + `generateStaticParams` (only the 8 curated slugs render; every
  other slug 404s → no combinatorial/thin pages). Side-by-side key-spec table, per-model
  "what's different" highlights, a unique intro, live inventory CTAs (gated on `countMakeModel`
  > 0 so no link 404s), breadcrumbs, `generateMetadata` (title/desc/canonical/OG/Twitter),
  and links to the other comparisons.
- **New** `src/app/aircraft/compare/page.tsx` — a small index hub listing all comparisons
  (gives the breadcrumb a target + a crawl hub; in the sitemap).
- **Edit** `src/app/aircraft/[make]/[model]/page.tsx` — add a "Compare the {label}" links
  block (only when curated comparisons exist for that family) → internal links from the
  indexed model seed pages into the new family.
- **Edit** `src/app/sitemap.ts` — add `/aircraft/compare` + the 8 comparison URLs.

## Acceptance criteria
- `/aircraft/compare/cessna-172-vs-cirrus-sr22` (and the other 7) return HTTP 200 with a
  side-by-side spec table, both models' highlights, and a unique intro.
- A non-curated slug (e.g. `/aircraft/compare/foo-vs-bar`) returns 404 (dynamicParams=false).
- `/aircraft/compare` index returns 200 and links to all 8 comparison pages.
- Each comparison page has a unique `<title>`, meta description, and self-canonical.
- The Cessna 172 model page renders a "Compare" block linking to its comparison pages.
- Sitemap includes the index + all 8 comparison URLs.
- `npx next build` + typecheck pass; qa-smoke exit 0 (HTTP 200, no app console errors, no
  horizontal overflow) at 1280 + 375 on the new pages; screenshots look right.

## Out of scope
- Comparison JSON-LD beyond the existing BreadcrumbList (no fabricated Product/Vehicle for a
  two-item compare).
- Combinatorial auto-generation of every pair (curated set only — anti-thin guardrail).
- Editing partnership/airport families; adding new spec data (reuse curated only).
- Footer/nav changes (the model-page block + index hub + sitemap carry crawlability).
