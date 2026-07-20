# admin-alerts-repermission-block

## Goal
Surface the dormant-subscriber re-permission ("still want these?") lifecycle — sends this
week/last week/all-time plus the unsubscribed/paused/still-live outcome breakdown — on the
on-demand `/admin/alerts` scoreboard, not just the Monday admin email, so a human checking
mid-week isn't blind until Monday.

## Scope
- `src/lib/alertScoreboard.ts` — new exported `getRepermissionRollup(now?)` helper (same
  graceful-degrade-on-missing-column pattern as `getUnsubscribeReasonRollup` in this file),
  reading `alerts.status`/`repermission_sent_at`/`frequency_changed_at`.
- `src/lib/alertFunnelWeekly.ts` — refactor `getAlertFunnelWeeklySnapshot` to call the new
  shared helper instead of duplicating the repermission computation inline (both `source`
  now share one query/logic path instead of two independent copies).
- `src/app/admin/alerts/page.tsx` — new "Re-permission lifecycle" section rendering the
  rollup, mirroring the three-honest-states copy already used in
  `buildAdminAlertFunnelEmail` (`email.ts`): not-migrated / zero-sent / real counts.

## Acceptance criteria
- `getRepermissionRollup` returns real sent-this-week/last-week/all-time counts plus the
  unsubscribed/paused/still-live status breakdown and the cadence-downshift count, using the
  same honest-degrade flags (`sentAtMigrated`, `frequencyChangedAtMigrated`) as every other
  `alerts.*` rollup in the file — never a fabricated number when a column isn't migrated live.
- `alertFunnelWeekly.ts`'s existing repermission fields (already covered by `email.test.ts`
  fixtures) are unchanged in shape/value — this is a refactor of *how* they're computed, not
  what they mean.
- `/admin/alerts` renders a new section with the same three states: "not migrated yet",
  "no re-permission emails sent yet", or real counts + breakdown.
- `npx next build` + `tsc --noEmit` clean; full unit suite green (no regressions).
- QA: production build served, `qa-smoke.mjs` on `/admin/alerts` (anon — confirms the
  FREEZE'd admin gate still renders, zero console errors, zero overflow, same precedent as
  every prior `/admin/alerts` cycle). Since the new panel itself isn't reachable by an
  anonymous crawl, independently verify `getRepermissionRollup()` against the real (read-only)
  prod DB via a throwaway, not-committed script — confirm it degrades honestly (the column is
  flagged unmigrated live) rather than crashing.

## Out of scope
- Applying the `repermission_sent_at`/`frequency_changed_at` migrations live (human action,
  same precedent as every other pending `alerts.*` DDL).
- The daily capture-funnel self-check (separate `[P2][goal]` item, next in the queue).
- Any change to the Monday admin email's copy/logic beyond the internal refactor.
