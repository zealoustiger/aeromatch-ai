# Persist the placement `source` on the alerts row

## Goal
Store the already-known placement `source` (e.g. `card_watch`, `filter_toolbar`,
`compare_page`, …) on each `alerts` row so per-widget conversion can eventually be
computed from the DB instead of only PostHog — closing the gap the
`admin-alerts-scoreboard` cycle identified.

## Scope
- `supabase/schema.sql` — additive `alerts.source text` column (human-apply DDL block,
  same template as `alerts_email_change`/`alerts_paused_until`).
- `src/app/actions.ts` — thread `source` through every alert-insert path, with the
  existing fail-soft "retry without unmigrated column" pattern:
  - `subscribeToAlerts` (new `source?: string` param, from `AlertSignup`'s existing prop)
  - `subscribeSignedInAlert` (same)
  - `subscribeToConfirmedAlert` → hardcoded `'cross_sell'`
  - `subscribeManageCrossSell` → hardcoded `'manage_cross_sell'`
  - `createManageAlert` → hardcoded `'manage_new'`
  - `subscribeSavedSearchAlert` → hardcoded `'saved_search'`
- `src/app/api/alerts/digest-cross-sell/route.ts` → hardcoded `'digest_cross_sell'`
- `src/components/AlertSignup.tsx` — pass its existing `source` prop into the
  `subscribeToAlerts`/`subscribeSignedInAlert` calls (currently only used for the
  PostHog event).

## Acceptance criteria
- New nullable `alerts.source` column added via an additive, human-apply DDL block in
  `schema.sql` (not applied to the live DB by this cycle — same convention as every
  prior `alerts.*` column).
- Every insert path above passes its known placement `source` value; the two
  caller-supplied paths (`subscribeToAlerts`/`subscribeSignedInAlert`) pass through
  `AlertSignup`'s existing `source` prop unchanged.
- Every insert path retries without `source` if the live column isn't migrated yet
  (`error.message?.includes('source')`), so alert capture never breaks pre-migration.
- `alert_subscribed`/`alert_capture_*` PostHog event payloads are unchanged (this is a
  DB-persistence-only change, no new capture point, no analytics-shape change).
- `npx tsc --noEmit` and `npx next build` both exit 0.
- QA smoke passes on `/aircraft`, `/partnerships` (both render `AlertSignup`) at
  desktop 1280 + mobile 375: HTTP 200, zero console errors, zero horizontal overflow.
- Live-verify (read-only + throwaway `@example.com` rows, deleted after) that a real
  subscribe either persists `source` (if the column happens to already exist) or
  degrades gracefully with no user-facing error (if it doesn't).

## Out of scope
- Applying the DDL to the live DB (human action).
- The follow-up "Per-placement conversion ranking on `/admin/alerts`" item (blocked on
  this column actually being migrated + having data — separate cycle).
- Backfilling `source` on existing rows (impossible — the value was never captured).
