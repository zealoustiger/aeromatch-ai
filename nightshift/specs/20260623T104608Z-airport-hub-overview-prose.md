# Airport hub overview prose — `/airports/[icao]`

## Goal
Give each genuinely-indexable airport hub page (`/airports/[icao]`) two paragraphs of
unique, evergreen, location-specific "co-ownership at this airport" prose, so these
crawl-hub pages carry real content depth instead of a templated count-only intro —
the unique-content-depth lever for the INDEXING stage (lane: `[goal]`).

## Context
- STAGE=INDEXING. The unique-content-depth item (BACKLOG line 258) lists the next
  slices as: partnership-state prose (✅ done, 10 states), for-sale-state prose
  (✅ done, 10 states), and **airport-page overviews** — the one still missing.
- Only 9 airports are genuinely indexable today (>=1 active partnership based there):
  KADS, KAUS, KFXE, KHWD, KLVK, KOAK, KPAO, KRHV, KSQL. Every other airport page is
  `noindex,follow` (thin-page guard in `nearbyPartnerships.ts`), so curating prose
  only for these 9 means every *indexed* airport page gains unique content, with no
  thin/doorway risk.

## Scope (small)
- `src/lib/seo.ts`: add `AIRPORT_OVERVIEWS: Record<string, string[]>` (keyed by
  lowercase ICAO) + a `getAirportOverview(icao)` resolver, mirroring the existing
  `getPartnershipStateOverview` / `getForSaleStateOverview` pattern. Curate the 9
  indexable hubs only.
- `src/app/airports/[icao]/page.tsx`: render the overview (when non-null) as an
  editorial prose block right under the H1 intro, above the "Based at {ICAO}" section.

## Acceptance criteria
- Each of the 9 indexable airport pages renders a 2-paragraph "About co-ownership at
  {airport}" section with genuinely unique, location-specific wording (no fabricated
  statistics, no live listing counts — well-known evergreen GA facts only).
- A non-curated airport (e.g. a thin/noindex one) renders **no** overview section
  (null fallback), exactly like the state-overview pattern.
- The prose is distinct in wording from the page's existing templated intro paragraph.
- `npx next build` + typecheck pass.
- QA smoke (HTTP 200, no app-origin console errors, no horizontal overflow at 1280 +
  375) passes on at least KPAO and KHWD; screenshots look right.

## Out of scope
- No new airport data, no schema changes, no changes to indexability/sitemap gating.
- No prose for non-indexable airports (they stay noindex and overview-less).
- No JSON-LD changes; no changes to the cross-link mesh or nearby logic.
