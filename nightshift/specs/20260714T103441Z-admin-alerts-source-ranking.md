# admin-alerts-source-ranking

## Goal
Add a "Top placements" ranking section to `/admin/alerts` so the human can see which
per-widget placement (`alerts.source` — card bell, filter chip, saved search, cross-sell,
etc.) is producing the most live subscribers, and how much of each placement's volume is
stuck at pending (unconfirmed double opt-in).

## Scope
- `src/lib/alertScoreboard.ts` — extend `getAlertScoreboard()`'s single query to also select
  `source`, with a graceful-degrade retry (mirroring the existing `actions.ts` insert-retry
  pattern) if the live DB doesn't have the column yet (confirmed today: it doesn't). Tally
  per-`source` live count + pending count, bucket `null`/missing source as
  `(untagged, pre-2026-07-14)` (the date `alert-source-column` shipped). Expose
  `topSources`, `sourceColumnMigrated` on `AlertScoreboardSnapshot`.
- `src/app/admin/alerts/page.tsx` — new 4th section, same card/bar-list visual pattern as
  the existing "Which pages convert" section. Ranks by live count desc; each row shows
  live count, pending count, and a confirm-rate (live / (live+pending)) percentage — only
  when there's enough pending+live volume to not be misleading (small-n floor, mirrors
  `MIN_ALERTS_TO_SHOW`-style flooring used elsewhere in this table's honesty patterns).
  Render an honest "the `source` column isn't migrated live yet — every row is bucketed as
  untagged until a human applies it" note when `sourceColumnMigrated` is false. Soften the
  existing "no per-widget placement tag today" sentence in the "Which pages convert" section
  since it's no longer accurate now that a `source` ranking exists (even though the column
  isn't live yet).

## Acceptance criteria
- `/admin/alerts` renders a 4th "Top placements" section, ranked by live (active+confirmed)
  count descending.
- Each row shows the placement name (or `(untagged, pre-2026-07-14)` bucket), live count,
  pending count, and — only above a small volume floor — a confirm-rate percentage.
- If `source` isn't queryable live (confirmed true today), the section still renders (all
  rows bucket to untagged) with a visible "not migrated yet" note — never a crash, never a
  fabricated ranking.
- No change to the admin auth gate (`src/app/admin/layout.tsx` untouched).
- No change to any `alerts` insert path, no new capture point, no new `alert_subscribed`
  emission.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- QA smoke passes on `/admin/alerts` at desktop 1280 + mobile 375 (HTTP 200 — note: admin
  pages 401/redirect for anonymous visitors, smoke just needs no server crash / no app
  console error on whatever the gate renders).

## Out of scope
- Adding/threading the `alerts.source` column migration itself (already shipped, pending
  human DDL application — this cycle only reads it).
- Any change to `alert_subscribed`/capture-point instrumentation.
- The separate `[P2][goal]` digest 👍/👎 vote-rate rollup (different item).
