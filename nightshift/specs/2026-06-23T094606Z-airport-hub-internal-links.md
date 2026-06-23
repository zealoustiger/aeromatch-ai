# Spec — airport-hub-internal-links

**Lane:** `[goal]` (last non-bug cycle `aircraft-below-market-deals` pulled `[want]`,
PASS → no blocker → `[goal]` owed per the 1:1). STAGE=INDEXING — internal linking is
the #2 indexing lever (after backlinks). This is the unchecked **"nearby-airport
cross-links"** slice of the `[P1][goal] Internal linking graph` backlog item
(wiring make↔model↔state↔airport↔listing).

## Goal
Wire the `/airports/[icao]` hub pages into the internal-linking graph so they stop
being crawl dead-ends — add (a) an up-link to the airport's **state partnership hub**
and (b) an **"Other airports with partnerships"** cross-link rail to the *other*
genuinely-indexable airport hubs, spreading crawl equity across the airport family.

## Scope (small)
- `src/lib/nearbyPartnerships.ts` — add `getIndexableAirportHubs()` returning the
  indexable airport hubs **with display details** (icao/name/city/state), reusing the
  existing `getIndexableAirportIcaos()` source-of-truth so the two can't drift.
- `src/app/airports/[icao]/page.tsx` — render:
  1. A breadcrumb/up-link to `/partnerships/state/<st>` when the airport's state is a
     known USPS code (`STATE_NAMES`).
  2. An "Other airports with active partnerships" rail linking the other indexable
     airport hubs (exclude self), each → `/airports/<icao>`.

## Acceptance criteria
- `/airports/<icao>` for an indexable airport (≥1 based partnership) renders a link to
  its `/partnerships/state/<st>` hub (when state is a known code) and a section listing
  the *other* indexable airport hubs, each a working internal link.
- Every airport link in the new rail points to an airport that itself resolves 200 with
  real content (only the gated indexable set — no thin/broken links). Self is excluded.
- No fabricated data: names/cities/states come straight from the `airports` table.
- `npx next build` + typecheck pass; QA smoke (HTTP 200, no app console errors, no
  horizontal overflow at 1280 + 375) passes on the affected airport page(s).
- No schema change, no new dependency, no change to which airports are indexable.

## Out of scope
- Curated per-airport prose / FAQ (a separate content-depth slice).
- Changing the indexability/thin-page rule or the sitemap.
- For-sale (`/aircraft/near`) airport pages — partnership airport hubs only this cycle.
