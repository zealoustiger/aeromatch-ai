# Spec — aircraft-mission-landing-pages

**Lane:** `[goal]` (last non-bug cycle `model-differentiator-highlights` pulled `[want]`;
last cycle PASS → no blocker → `[goal]` owed per the 1:1). STAGE=INDEXING.

**Backlog item:** `[P1][goal] Search-by-mission presets + SEO landing pages` — slice (2):
"Each also becomes an SEO page (`/aircraft/mission/[mission]`)". Slice (1) (mission chips on
`/aircraft`) already shipped in `AircraftChipBar`.

## Goal
Ship a new, genuinely-useful indexable page family — `/aircraft/mission/[mission]` — that
targets real high-intent buyer searches ("glass cockpit aircraft for sale", "tailwheel
aircraft for sale", "IFR aircraft for sale", "low-time aircraft for sale"), each combining
unique editorial buyer guidance with a live grid of the real matching listings.

## Scope (small, additive)
- `src/lib/missions.ts` — a fixed, curated registry of 4 missions (slug, labels, H1, title,
  meta, unique intro prose, and a filter mapping onto the EXISTING `fetchAircraftPage`
  filters — no new query logic, no new DB columns).
- `src/app/aircraft/mission/[mission]/page.tsx` — the route. `generateStaticParams` over the
  4 curated slugs; `generateMetadata` (title/desc/canonical/OG/Twitter); renders Breadcrumbs,
  unique intro prose, the live `AircraftSaleList` (reused, with `basePath` so paging stays on
  the mission route), ItemList JSON-LD matching the visible cards, internal links to the other
  missions + make hubs + `/aircraft`. Unknown slug → `notFound()`.
- `src/app/aircraft/page.tsx` — add a small crawlable "Browse by mission" internal-links block
  (so the new family is reachable from priority seed page #2).
- `src/app/sitemap.ts` — add the 4 mission URLs (curated content pages, like guides).

## Acceptance criteria
- [ ] `/aircraft/mission/{glass-cockpit,ifr,tailwheel,low-time}` each return HTTP 200 with a
      unique H1, unique title, unique meta description, self-canonical, and 2-3 paragraphs of
      distinct (non-duplicate) buyer-guidance prose.
- [ ] Each page renders the live matching listings via the shared `AircraftSaleList` (real
      data), with paging staying under `/aircraft/mission/[mission]`.
- [ ] An unknown mission slug (e.g. `/aircraft/mission/foo`) returns 404.
- [ ] The 4 mission pages are reachable via a "Browse by mission" links block on `/aircraft`
      and are present in `sitemap.xml`.
- [ ] `npx next build` + typecheck pass; QA smoke (HTTP 200, zero app console errors, zero
      horizontal overflow at 1280 + 375) passes; screenshots look right.

## Out of scope
- Re-wiring the existing `AircraftChipBar` mission chips to deep-link to these pages (keep
  their tested in-place filter behavior; possible follow-up).
- A partnerships-side mission family.
- New filter columns / query logic / schema changes.
- FAQ accordion (intro prose + live listings are enough for this slice).
