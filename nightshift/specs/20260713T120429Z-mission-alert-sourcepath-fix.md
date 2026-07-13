# mission-alert-sourcepath-fix

## Goal
Fix a live honesty gap: an `AlertSignup` subscription made on any `/aircraft/mission/[mission]`
page can never fire, because both alert parsers explicitly skip that path prefix — make the
capture point emit a `source_path` those parsers can actually match.

## Background (verified before scoping)
- `src/app/aircraft/mission/[mission]/page.tsx:144` mounts `<AlertSignup sourcePath={basePath} .../>`
  where `basePath = /aircraft/mission/${m.slug}` (e.g. `/aircraft/mission/glass-cockpit`).
- `src/app/api/cron/alert-digest/route.ts:188` (`parseSourcePath`) and
  `src/lib/alertMatchCounts.ts:114` both `return null` for any path starting with
  `/aircraft/mission/` — so a mission-page alert can never produce a match count, a digest
  email, or an edit-criteria UI on `/alerts/manage`.
- Every one of the 10 curated missions (`src/lib/missions.ts`) maps onto plain
  `fetchAircraftPage` filter keys already supported end-to-end by the `/aircraft?...`
  query-string shape: `q`, `max_tt`, `min_year`, `max_price` (confirmed by reading both
  parsers' existing `/aircraft?...` branch, which handles all four).
- Checked the live DB (read-only, service role): **0 existing `alerts` rows** have
  `source_path LIKE '/aircraft/mission/%'` — so there is nothing to backfill/migrate. This
  cycle only needs to stop new dead rows from being created.

## Scope
- `src/app/aircraft/mission/[mission]/page.tsx`: build the `AlertSignup` `sourcePath` from
  `m.filters` (the same object already used to query `AircraftSaleList`) as an `/aircraft?...`
  query string, instead of the dead `basePath`. Use `URLSearchParams` over the filter's
  `q`/`max_tt`/`min_year`/`max_price` keys (only the ones present — some missions set only one).
  Leave `basePath` itself untouched (still used for the page URL, canonical, `AircraftSaleList`
  paging, cross-links).
- No changes to `parseSourcePath`, `alertMatchCounts.ts`, `AlertSignup`, or any schema — the
  `/aircraft?...` shape they need already works; this is a capture-site fix only.

## Acceptance criteria
- Visiting any `/aircraft/mission/<slug>` page and subscribing produces an `alerts` row whose
  `source_path` is `/aircraft?<query>` (built from that mission's real filters), not
  `/aircraft/mission/<slug>`.
- The resulting `source_path` is real — spot-check that `parseSourcePath` (cron) and
  `alertMatchCounts.ts` both resolve it to a non-null target for at least 2 missions
  (one `q`-based, the `low-time` `max_tt`-based one).
- `context` copy (`"{label} aircraft for sale"`) is unchanged.
- The mission page itself (H1, intro, listings grid, FAQ, cross-links) is visually unchanged —
  this is a prop-value change only, not a UI change.
- `npx tsc --noEmit` and `npx next build` stay green.

## Out of scope
- Adding a live match-count line / widen-suggestion to the mission-page `AlertSignup` (it
  doesn't pass `matchCount` today either; a separate follow-up).
- Any data migration of existing rows (none exist — verified).
- Changing the mission page's own route/URL, canonical, or `AircraftSaleList` filtering.
