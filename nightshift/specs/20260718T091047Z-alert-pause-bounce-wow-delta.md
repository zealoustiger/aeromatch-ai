# alert-pause-bounce-wow-delta

## Goal
Add `paused_at`/`bounced_at` timestamps to the `alerts` table and wire them into the
Monday admin alert-funnel email so Paused and Bounced get a real week-over-week delta,
same honesty-gated treatment `unsubscribed_at` got last cycle (slice 2 of
"Status-change timestamps → real WoW deltas in the Monday admin email").

## Scope
- `supabase/schema.sql` — additive `alerts.paused_at timestamptz` +
  `alerts.bounced_at timestamptz` (nullable, no default, forward-only), mirroring the
  `alerts_unsubscribed_at` migration block exactly.
- `src/app/actions.ts` — stamp `paused_at` in `pauseAlert`, `snoozeAlert`,
  `pauseAllAlerts`, `pauseAlertByToken`, `snoozeAlertByToken`; clear `paused_at` (and
  `bounced_at`) in `resumeAlert`; clear `paused_at`/`bounced_at` in `resumeAllAlerts`
  AND fix it to also resume `bounced` rows (currently only queries
  `.eq('status','paused')`, so bulk-resume silently misses bounced rows).
- `src/lib/alertBounce.ts` — stamp `bounced_at` in `pauseAlertsForBouncedEmail`.
- `src/app/api/cron/alert-digest/route.ts` — stamp `paused_at` in the listing-watch
  auto-pause; clear `paused_at` in the snooze auto-resume-when-`paused_until`-passes.
- `src/lib/alertFunnelWeekly.ts` — extend the snapshot with
  `pausedThisWeek`/`pausedLastWeek`/`pausedAtMigrated` and
  `bouncedThisWeek`/`bouncedLastWeek`/`bouncedAtMigrated`, same optional-column
  graceful-degrade loop already covers `source`/`unsubscribed_at`.
- `src/lib/email.ts` — `buildAdminAlertFunnelEmail` renders real WoW rows for
  Paused/Bounced once migrated (current-totals-only fallback unchanged otherwise).
- `src/lib/email.test.ts` — update the existing "paused/bounced never get a WoW
  delta" test (now conditional on the migrated flag, mirroring the unsubscribed
  tests) + add mirrored migrated/not-migrated cases for both.

## Acceptance criteria
- Every write path that flips status → `'paused'` stamps `paused_at`; every write
  path that flips status → `'bounced'` stamps `bounced_at`.
- `resumeAlert` (paused OR bounced → confirmed) clears both `paused_at` and
  `bounced_at`. `resumeAllAlerts` now resumes bounced rows too, not just paused.
- Every touched write path fails soft (retries without the new column) against the
  current, not-yet-migrated live DB — verified against real prod schema.
- `getAlertFunnelWeeklySnapshot` returns real week-over-week Paused/Bounced deltas
  once the columns are migrated; all-current-totals-only fallback is byte-identical
  to today's behavior when not migrated.
- `buildAdminAlertFunnelEmail` renders the new WoW rows only when migrated; the
  current-totals stock counts (Paused/Bounced) still render unchanged either way.
- `npx tsc --noEmit` and `npx next build` both exit 0; full `node --test` suite passes.
- QA smoke (production build) passes on `/alerts/manage`, `/alerts/status`.

## Out of scope
- The `/admin/alerts` 8-week trend sparkline (`alertWeeklyTrend.ts`) — separate
  surface, not named in this backlog item.
- Digest 👍/👎 feedback counts, "narrow this alert" nudge, aria-live sweep — other
  open `[P2][goal]` items, not this slice.
