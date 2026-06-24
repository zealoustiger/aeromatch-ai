# browse-compare-mission-links

## Goal
Close an internal-linking gap on the `/aircraft/browse` crawl-index hub by adding
**Compare aircraft** and **By mission** sections that link the curated
`/aircraft/compare/[slug]` and `/aircraft/mission/[mission]` families — both already
in the sitemap but currently unreachable from the site's main "all aircraft pages"
index — so crawlers (and humans) reach them from the highest-authority aircraft hub.

## Lane
`[goal]` — last non-bug cycle (`clubhanger-estimate-deal-verdict`) pulled `[want]`;
last cycle PASS → no blocker → `[goal]` owed per the 1:1. STAGE=INDEXING; this is a
pure internal-linking / crawl-equity-distribution slice (the #2 indexing lever after
backlinks), no new pages, zero fabrication.

## Scope
- `src/app/aircraft/browse/page.tsx` only.
  - Add a **Compare aircraft** section: a link per `COMPARISONS` entry to
    `/aircraft/compare/[slug]` labeled "{make} {model} vs {make} {model}" (via the
    existing `resolveComparisonModel`), plus a link to the `/aircraft/compare` index.
  - Add a **By mission** section: a link per `MISSIONS` entry to
    `/aircraft/mission/[slug]` labeled with `mission.label`.
  - Add matching jump-anchors to the in-page nav and widen the meta/intro copy to
    mention comparisons + missions.

## Acceptance criteria
- `/aircraft/browse` renders new **Compare aircraft** and **By mission** sections,
  each linking to every curated comparison / mission page (labels match the
  destination pages, e.g. "Cessna 172 vs Cirrus SR22", "Glass cockpit").
- Every new link resolves to a real existing page (the same fixed `COMPARISONS` /
  `MISSIONS` lists already emitted in `sitemap.ts`) — no 404s, no new pages.
- The existing By-make / By-make&model / By-state sections and CollectionPage JSON-LD
  are unchanged (the additions are purely additive navigation).
- `npx next build` + typecheck pass; QA smoke (HTTP 200, no app-origin console errors,
  no horizontal overflow at 1280 + 375) passes on `/aircraft/browse`.
- Screenshots show the new sections rendering cleanly on desktop + mobile.

## Out of scope
- No changes to the compare/mission pages themselves, the sitemap, or any data.
- No new page family; no schema/DB change.
- Not touching the CollectionPage JSON-LD mainEntity (stays the make-hub ItemList).
