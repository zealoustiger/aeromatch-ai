# alert-unsub-wow-delta

## Goal
Give the Monday admin alert-funnel email an honest week-over-week "Unsubscribed" delta
(currently a plain current-total, never trended) by adding a real `unsubscribed_at`
timestamp to the `alerts` table and stamping/clearing it at every status flip
to/from `'unsubscribed'`.

## Scope
Slice 1 of BACKLOG's `[P1][goal] Status-change timestamps → real WoW deltas in the
Monday admin email` — `unsubscribed_at` only (the headline churn metric). `paused_at`
and `bounced_at` are explicitly deferred to follow-up slices (noted in CHANGELOG),
keeping this cycle's diff reviewable.

Files expected to touch:
- `supabase/schema.sql` — additive `alerts.unsubscribed_at timestamptz` column
  (⚠️ human-apply, fail-soft same as every prior `alerts.*` migration).
- `src/app/api/alerts/unsubscribe/route.ts` — stamp on one-click unsubscribe.
- `src/lib/alertBounce.ts` — stamp on spam-complaint unsubscribe.
- `src/app/actions.ts` — clear on every path that revives FROM `'unsubscribed'`:
  `pauseAlertByToken`, `snoozeAlertByToken`, `updateAlertFrequencyByToken`
  (the 3 `UnsubscribeRecover` actions), `reviveIfUnsubscribed`.
- `src/lib/alertFunnelWeekly.ts` — select the new column (fail-soft retry loop,
  mirroring `alertsForOwner.ts`'s `OPTIONAL_COLS` pattern), bucket into
  `unsubscribedThisWeek`/`unsubscribedLastWeek`, add `unsubscribedAtMigrated`.
- `src/lib/email.ts` — `buildAdminAlertFunnelEmail` renders a real "Unsubscribed"
  WoW row (html + text) when migrated; unchanged (current-totals only) otherwise.
- `src/lib/email.test.ts` — update/extend tests for the new WoW row + fallback.

## Acceptance criteria
1. `alerts.unsubscribed_at` is additive-only (`add column if not exists`, nullable,
   no default) with the standard "⚠️ HUMAN ACTION REQUIRED" comment block.
2. Every code path that sets `status: 'unsubscribed'` also stamps `unsubscribed_at`;
   every code path that revives an alert away from `'unsubscribed'` also clears it
   back to `null`. Both directions fail soft (retry without the column) if the
   migration hasn't been applied live yet — never a user-facing error either way.
3. `getAlertFunnelWeeklySnapshot` returns real `unsubscribedThisWeek`/
   `unsubscribedLastWeek` counts (bucketed off `unsubscribed_at`, same 7/14-day
   window as `createdThisWeek`/`confirmedThisWeek`) plus `unsubscribedAtMigrated`.
   `unsubscribedTotal` (the existing current-status stock count) is unchanged.
4. `buildAdminAlertFunnelEmail` shows a real "Unsubscribed … vs last week" row
   next to New signups/Confirmed when `unsubscribedAtMigrated` is true; when false,
   output is byte-for-byte the same as today (current-totals only, no WoW row) —
   verified by a fallback test.
5. `npx tsc --noEmit` and `npx next build` both exit 0; `node --test` on
   `src/lib/email.test.ts` (and the full suite) passes with 0 failures.
6. QA: production build smoke on `/alerts/manage`, `/alerts/status` (pages whose
   server actions this touches) — HTTP 200, zero console errors, zero horizontal
   overflow at desktop 1280 + mobile 375. Non-visual cycle (email content + admin
   cron logic, no rendered-page UI change) — screenshots saved for the audit trail,
   not read into the QA verdict.

## Out of scope
- `paused_at` / `bounced_at` columns and their WoW deltas (follow-up slice).
- Any UI change to `/alerts/manage` or `/alerts/status` (server-action/email/cron
  logic only).
- Backfilling `unsubscribed_at` for existing already-unsubscribed rows (the
  migration is nullable/forward-only, same convention as every prior `alerts.*`
  timestamp column — historical unsubscribes before the migration simply have no
  timestamp and won't appear in a WoW bucket, same honest-gap posture as
  `last_confirm_sent_at`/`paused_until` etc.).
