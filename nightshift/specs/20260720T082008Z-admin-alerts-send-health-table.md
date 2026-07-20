# Spec: admin-alerts-send-health-table

## Goal
Add a compact last-7-runs send-health table to the `/admin/alerts` cron-health section so an
admin can see `emailsSent` / `sendFailures` / `deferredSends` / capture self-check outcome per
run, instead of only the single most-recent run currently shown.

## Scope
- `src/app/admin/alerts/page.tsx` — extend the existing "Cron health — `alert-digest`" section
  with a new last-7-runs table below the current last-run stat grid. Fetch
  `getRecentCronRuns(7)` (already exported by `src/lib/alertCronHealth.ts`, unused until now)
  alongside the existing `getLastCronRun()` call.
- No changes to `src/lib/alertCronHealth.ts` (the data helper already returns everything
  needed: `emailsSent`, `sendFailures`, `deferredSends`, `captureSelfCheckOk`,
  `captureSelfCheckStep`, all nullable for the unmigrated case).
- No schema change, no new capture point, no new library file.

## Acceptance criteria
- Table renders one row per run (newest first) from `getRecentCronRuns(7)`: date, emails sent,
  send failures, deferred sends, capture self-check outcome.
- Per-column honest degrade: `sendFailures` / `deferredSends` render "—" (not a fabricated 0)
  when the value is `null` (column not migrated live yet); capture self-check renders
  PASS / FAILED at `<step>` / "—" (not migrated) — same three-state convention as the Monday
  email's `selfCheckMessage` in `email.ts`.
- Zero-runs case (empty `alert_cron_runs` or unmigrated table) shows the existing "No cron run
  data yet" copy — no new empty state needed since it's the same underlying table.
- A run with real (non-null) `sendFailures > 0` is visually flagged (e.g. red text), matching
  the site's existing "flag the bad number" convention (stale-run banner, rose-colored counts
  elsewhere on this page).
- No change to any other section of `/admin/alerts`; anonymous visitors still see the FREEZE'd
  admin-only gate (no visible change to unauthenticated behavior).
- `npx tsc --noEmit` and `npx next build` both exit 0.

## Out of scope
- Any change to `alertCronHealth.ts`'s query shape or the `alert_cron_runs` schema.
- The sibling `[P1][goal]` items in the same batch (demand-vs-supply block, post-success
  matching-subscribers line) — separate cycles.
- Pagination / more than 7 rows / a dedicated new page.
