# alert-unsubscribe-reasons

## Goal
Persist the one-tap unsubscribe-reason chip taps on `/alerts/status` into the
existing (fail-soft, unmigrated-safe) `alerts.unsubscribe_reason` column, and
surface a "Why people unsubscribe" breakdown in the Monday admin funnel email
and on `/admin/alerts`.

## Scope
- `src/lib/alertUnsubscribeReasons.ts` (new): canonical reason list
  (`too_many_emails` / `not_relevant` / `found_aircraft` / `just_done`) +
  labels, and a pure `summarizeUnsubscribeReasons(rows, now)` helper that
  buckets counts into this-week / all-time (unit-tested).
- `src/app/actions.ts`: new `recordUnsubscribeReasonByToken(token, reason)`
  server action — same token-scoped, fail-soft-on-missing-column pattern as
  the existing `markAlertFoundAircraftByToken`. Validates `reason` against the
  canonical list.
- `src/components/UnsubscribeRecover.tsx`: `handleReason` now also calls the
  new action (fire-and-forget, never blocks or errors the "Thanks — that
  helps" UI) instead of only firing the PostHog event. Reason list sourced
  from the new shared module (removes the local duplicate).
- `src/lib/alertScoreboard.ts`: new `getUnsubscribeReasonRollup(now)` —
  reads `unsubscribe_reason`/`unsubscribed_at` from `alerts` with the
  established optional-column retry/fallback, returns top reasons
  (this-week + all-time) via the pure summarizer.
- `src/lib/alertFunnelWeekly.ts`: wire the rollup into
  `AlertFunnelWeeklySnapshot` (`unsubscribeReasons`, `unsubscribeReasonColumnMigrated`).
- `src/lib/email.ts`: `buildAdminAlertFunnelEmail` — new "Why people
  unsubscribe" section (HTML + text), honest empty state.
- `src/app/admin/alerts/page.tsx`: mirror as a small section, matching the
  existing "Least relevant listings this week" widget's style.
- Update the `admin-alert-funnel` dev email-preview fixture + `email.test.ts`
  fixture with the new snapshot fields.

## Acceptance criteria
- Tapping a reason chip on `/alerts/status` writes `unsubscribe_reason` on
  the unsubscribed alert row(s) (fail-soft, no user-facing error either way).
- `getUnsubscribeReasonRollup`/`summarizeUnsubscribeReasons` correctly bucket
  this-week vs. all-time and degrade to an honest empty state when the column
  isn't migrated or nothing's been recorded — never a fabricated count.
- Monday admin funnel email renders the new breakdown (or its empty state);
  `/admin/alerts` shows the same breakdown.
- `npx tsc --noEmit` and `npx next build` both pass.
- Existing + new unit tests pass (`node --experimental-strip-types --test`).
- QA smoke passes on `/alerts/status` and `/admin/alerts` (desktop 1280 +
  mobile 375, no console errors, no overflow).

## Out of scope
- Any change to the `found_aircraft` dedicated button's own action.
- New schema/migration (column already declared in `schema.sql`, human-apply
  pending, same as several sibling `alerts.*` columns).
- A per-reason automated response (e.g. auto-widening on `not_relevant`).
