# parts-filter-pattern-gaps

## Goal
Close confirmed gaps in the non-aircraft (parts/wanted) listing filter so higher-priced
junk rows can't leak onto `/aircraft` and related buyer-facing surfaces, without
false-positiving on real aircraft listings.

## Context
BACKLOG.md `[P1][bug] Hide parts/wanted listings — only show actual aircraft` reported
specific leaked titles (WING ASSEMBLY, WHEELPANTS, a WANTED ad). Investigation this cycle
found those exact titles are already gone (an earlier fix — commit `a4ffac9` — added
`PARTS_TITLE_PATTERNS` / display-layer filtering + scraper-level regex, both already wired
into the main feed query, the distance RPC (`aircraft_by_distance`, parameterized —
no migration needed), the sitemap query, and "similar aircraft"). But a live DB check
today found real junk titles that still slip past the current pattern list because the
"wing" patterns only match when "wing(s)" is the literal last word or in "wing tip"/
"wing assembly" with a space: `WINGTIPS` (no space), `WING RACK`, `WING ASSY`
(abbreviation), and bare `GOVERNOR` (a standalone prop part) all pass through untouched.
These specific rows are invisible on the live feed today only because they happen to be
priced below the $50k floor or unpriced — a coincidence, not a guarantee — so a future
higher-priced ingest with one of these patterns would leak through.

## Scope
- `src/lib/partsFilter.ts` — add narrow, high-confidence patterns for the confirmed gaps:
  `%wingtip%`, `% wing assy%`, `% wing rack%`, `%governor%`.
- `scraper/adapters/barnstormers.mjs` — mirror the same terms into the ingest-time title
  regex (`wingtips?`, `wing\s*assy`, `wing\s*rack`, `governor`) so new scrapes are caught
  at the source, not just display-time.
- No DB schema change, no backfill/rewrite of existing rows (FREEZE: no bulk-rewrite of
  existing listings) — purely additive pattern-list entries consumed by existing,
  already-parameterized call sites.

## Acceptance criteria
- `PARTS_TITLE_PATTERNS` includes the 4 new patterns, each documented with a one-line
  rationale per the file's existing comment convention.
- The Barnstormers adapter's title regex includes the mirrored keywords.
- `npx tsc --noEmit` and `npx next build` pass clean.
- QA smoke passes on `/aircraft` (and one make/model page) at desktop 1280 + mobile 375,
  zero console errors, zero overflow — confirms the filter change didn't break the feed.
- Spot-check: none of the new patterns match any currently-active genuine aircraft
  listing title in the live DB (read-only query), to keep the "zero false positives" rule.

## Out of scope
- Backfilling/cleaning existing junk rows already in `aircraft_for_sale` (FREEZE: no
  bulk-rewrite of existing listings/drafts).
- Adding a `category`/`is_aircraft` schema column (bigger, separate slice; not needed to
  close this specific gap).
- Broader "spares"/"project" patterns — both risk false-positiving on genuine listings
  ("project aircraft" is a legitimate, human-named category elsewhere in the backlog), so
  deliberately left out; flagged as a "Next" note instead of guessed at.
