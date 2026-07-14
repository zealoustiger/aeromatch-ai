# alert-digest-legacy-active-status

## Goal
Fix a P0 bug: the alert digest cron only ever selects `alerts.status = 'confirmed'`,
so real subscribers whose row carries the older/legacy `status = 'active'` vocabulary
never receive a digest email — silently, forever, with no error surfaced anywhere.

## Context
`src/lib/alertScoreboard.ts` already documents and handles this split ("The `alerts`
table carries two live-subscriber vocabularies: newer opt-in paths land on `confirmed`
... while older/direct rows use `active`. Both mean 'an opted-in subscriber who should
receive digests'"), with `LIVE_STATUSES = new Set(['active', 'confirmed'])`. But
`src/app/api/cron/alert-digest/route.ts` (the actual send path — `vercel.json` runs it
daily at 08:00 UTC) never got the same fix: its fetch query is `.eq('status',
'confirmed')` (two call sites, the primary select + the retry-without-optional-columns
fallback). Verified against the live prod `alerts` table (read-only, service-role key):
3 real rows currently sit at `status = 'active'` and are excluded by this query today.

## Scope
- `src/app/api/cron/alert-digest/route.ts` — broaden both alert-fetch queries from
  `.eq('status', 'confirmed')` to `.in('status', ['confirmed', 'active'])`, matching the
  `alertScoreboard.ts` precedent. Add a short comment pointing at that precedent so the
  vocabulary split doesn't get silently re-forked again.

## Acceptance criteria
- Both digest-fetch queries in `alert-digest/route.ts` select `status IN ('confirmed',
  'active')` instead of only `'confirmed'`.
- `npx tsc --noEmit` and `npx next build` both pass.
- Live-verified (read-only + a scoped, reversible check) that the new query shape
  actually returns the previously-excluded legacy rows.
- No change to which columns are written, no schema change, no change to any other
  status transition/guard in the codebase (pause/resume/manage-page UI gating on
  `status === 'confirmed'` is a separate, smaller follow-up — out of scope here).
- `qa-smoke.mjs` passes on `/alerts/manage` and `/aircraft` (non-visual/backend cycle).

## Out of scope
- Migrating the 3 legacy rows' `status` value in the DB (the code fix makes this
  unnecessary — both statuses now work).
- Fixing the `actions.ts` pause/snooze/resume guards or the `/alerts/manage` UI's
  `status === 'confirmed'` checks for legacy `active` rows (a real but smaller gap;
  noted as a follow-up).
- Any other alert-experience feature work.
