# frequency_changed_at stamping — honest cadence-downshift measurement

## Goal
Stamp an additive `alerts.frequency_changed_at` column on every real frequency
write path, then use it to add a genuinely-attributed "downshifted cadence
since the re-permission email" count to the Monday admin alert-funnel email —
closing the gap `alert-funnel-repermission-line` (batch #10) explicitly scoped
out because no cadence-change history existed.

## Scope
- `supabase/schema.sql` — additive `alerts.frequency_changed_at timestamptz`
  column block (⚠️ human-apply, same precedent as `repermission_sent_at`).
- `src/app/actions.ts` — stamp it in `updateAlertFrequency` and
  `updateAlertFrequencyByToken` (same graceful-degrade-on-missing-column retry
  pattern already used for `frequency`/`unsubscribed_at`/etc. in each).
- `src/app/api/alerts/frequency/route.ts` — stamp it in `applyFrequency` and
  `applyFrequencyStep` (only on rows that actually stepped, for the latter).
- `src/lib/alertFunnelWeekly.ts` — read the new optional column (graceful
  degrade), compute `repermissionDowngradedCadenceCount`: alerts that got a
  `repermission_sent_at` AND whose `frequency_changed_at` postdates it. Add
  `repermissionDowngradedCadenceCount` + `frequencyChangedAtMigrated` to
  `AlertFunnelWeeklySnapshot`.
- `src/lib/email.ts` — `buildAdminAlertFunnelEmail`: render a "Downshifted
  cadence since re-permission" line alongside the existing
  unsubscribed/paused/still-live re-permission breakdown, honest three-state
  (not migrated / zero / real count).
- Unit tests in `email.test.ts` covering the new line's three states.

## Acceptance criteria
- New `alerts.frequency_changed_at` column block added to `schema.sql` with
  the same human-apply comment convention as prior columns.
- Every listed frequency write path stamps `frequency_changed_at` on a
  successful write, with fail-soft retry-without-column if the migration
  isn't applied live yet (never a user-facing error from the new column).
- `alertFunnelWeekly.ts` computes a real, honestly-attributed downshift count
  (only counts alerts whose frequency changed *after* their re-permission
  send) — never fabricates a number when the column is unmigrated.
- Admin funnel email (HTML + text) renders the new line with three honest
  states: column-not-migrated / migrated-but-zero / real count.
- `npx next build` + `tsc --noEmit` clean; new/changed unit tests green
  alongside the full existing suite.
- QA: production build served via `next start`; `qa-smoke.mjs` on `/alerts`,
  `/aircraft` passes (this is a non-visual/internal-logic cycle — no page
  markup changes).

## Out of scope
- Mirroring the line onto `/admin/alerts` (separate module/slice, not asked
  for by this item).
- Any other batch #11 item (snooze-link parity, admin re-permission block,
  deliverability micro-copy, capture self-check).
