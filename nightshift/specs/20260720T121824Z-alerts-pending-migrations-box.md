# Pending-migrations action box on /admin/alerts

## Goal
Add a single read-only "pending migrations" checklist to the top of `/admin/alerts` that
probes the live DB for the ~8 optional alert-related columns/tables the codebase already
knows how to gracefully degrade without, and lists — with exact copy-paste SQL — only the
ones still missing, so the human has one place to see what to apply instead of hunting
scattered inline footnotes.

## Scope
- New `src/lib/pendingAlertMigrations.ts`: exports `getPendingAlertMigrations(flags)` which
  takes the migration flags the page already computes from existing rollups
  (`sourceColumnMigrated`, `frequencyMigrated`, `frequencyChangedAtMigrated`,
  `reasonColumnMigrated`, `unsubscribedAtMigrated`) plus does 3 new lightweight read-only
  probes of its own (table-exists check for `alert_cron_runs`, table-exists check for
  `email_engagement_events`, column-exists check for `alerts.confirm_reminder_sent_at`) —
  reusing the exact same "select and check `error.message` for the column/table name"
  convention already used throughout `alertScoreboard.ts` / `webhooks/resend/route.ts` /
  `api/cron/alert-digest/route.ts`. Returns an array of `{ key, label, unlocks, sql }` for
  every one of the 8 items still missing; empty array when all are live.
- `src/lib/alertScoreboard.ts`: add `unsubscribedAtMigrated: boolean` to
  `UnsubscribeReasonRollup`'s return type (the value is already computed internally at
  line ~439, just never returned) — additive field, no existing caller breaks.
- `src/app/admin/alerts/page.tsx`: call `getPendingAlertMigrations` alongside the existing
  `Promise.all` fetches (passing the already-computed flags — no duplicate `alerts` table
  queries beyond the 3 new tiny probes), and render a new box as the very first child of
  the page, above the email-template-gallery link. Renders nothing when the list is
  empty. Each pending item shows: label, one-line "what it unlocks," and a `<pre>` block
  with the exact SQL from `supabase/schema.sql` (verbatim, copy-pasteable).
- **Out of scope:** the `alerts_owner_select` RLS policy. Confirmed by research that it
  cannot be probed from application code — `createAdminClient()` uses the service-role
  key, which bypasses RLS entirely, so a query through it can never distinguish "policy
  applied" from "policy missing." Left out of the automated box; not this cycle's job to
  invent an unreliable/hardcoded signal for it (would violate the item's own "never a
  hardcoded guess" requirement). No schema change, no new capture point, no other page
  touched.

## Acceptance criteria
- `/admin/alerts` renders a new box at the top listing exactly the missing items among:
  `alert_cron_runs` table, `alerts.source`, `alerts.frequency`, `alerts.frequency_changed_at`,
  `alerts.unsubscribe_reason`, `alerts.unsubscribed_at`, `email_engagement_events` table,
  `alerts.confirm_reminder_sent_at` column.
- Each listed item shows a one-line "what it unlocks" and the literal SQL from
  `supabase/schema.sql` needed to apply it.
- The box renders nothing (no empty shell) when every one of the 8 items is already live.
- No new console errors, no schema change, no destructive SQL of any kind (read-only
  probes only).
- `npx next build` + `tsc --noEmit` pass clean.
- QA smoke (desktop 1280 + mobile 375) passes on `/admin/alerts`.

## Out of scope
- The `alerts_owner_select` RLS policy (unprobeable via the service-role admin client).
- Any other migration not in the 8-item list above (e.g. `paused_until`,
  `last_confirm_sent_at`, `digest_day`, `target_price`, etc. — already either applied or
  not part of this backlog item's named scope).
- Applying any migration — this cycle only reports.
