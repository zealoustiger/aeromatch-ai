# Re-permission lifecycle line in the Monday admin funnel email

## Goal
Give the Monday admin alert-funnel email (and its `getAlertFunnelWeeklySnapshot`
data source) a "Re-permission" line so the human can see whether the
`alert-dormant-repermission` "still want these?" emails (shipped earlier this
drain) are working, instead of sending into a deaf loop with no rollup.

## Scope
- `src/lib/alertFunnelWeekly.ts` — extend `getAlertFunnelWeeklySnapshot` to read
  the optional `repermission_sent_at` column (⚠️ human-apply, unmigrated live
  today, same graceful-degrade precedent as `paused_at`/`unsubscribed_at`) and
  compute: emails sent this week / last week / all-time, plus a **status
  breakdown of alerts that ever got one** (currently unsubscribed / currently
  paused / currently live-confirmed).
- `src/lib/email.ts` — `buildAdminAlertFunnelEmail`: render a new "Re-permission"
  table row (this-week count) + a small status-breakdown block, mirroring the
  existing "Instant-alerts interest" honest-empty-state pattern. HTML + text
  versions.
- Unit tests in `alertFunnelWeekly.test.ts` / `email.test.ts` for the new field
  and its unmigrated-column fallback.

## Design decision (honesty gate)
The backlog item asks for "unsubscribed, downshifted cadence, or stayed active."
There is no historical record of an alert's `frequency` value over time (no
`frequency_changed_at`, no change log) — only the current value — so "downshifted
cadence **since** the repermission email" cannot be computed without guessing at
causation. Reporting it would risk exactly the kind of fabricated signal GOAL.md's
honesty rule forbids. Scoping this line to what's directly, honestly derivable
from current `status` (unsubscribed / paused / still live) among
repermission-sent alerts — cadence-since-repermission is flagged as a follow-up
that would need a new `frequency_changed_at` column to answer honestly.

## Out of scope
- Mirroring onto `/admin/alerts` (different data source, `alertScoreboard.ts` —
  a separate slice; noted as a follow-up, not required by RUNBOOK's "if trivial"
  qualifier once the above is scoped).
- A `frequency_changed_at` column / cadence-downshift tracking.
- Any change to when/how the repermission emails themselves are sent.

## Acceptance criteria
- `getAlertFunnelWeeklySnapshot` returns `repermissionSentThisWeek`,
  `repermissionSentLastWeek`, `repermissionSentAllTime`,
  `repermissionUnsubscribedCount`, `repermissionPausedCount`,
  `repermissionStillLiveCount`, `repermissionSentAtMigrated`.
- When `repermission_sent_at` isn't migrated live, all repermission fields are
  honest 0/false — never fabricated — and the query still succeeds (graceful
  column-drop retry, same pattern as the other optional columns in this file).
- The admin funnel email (`buildAdminAlertFunnelEmail`) renders a "Re-permission"
  line with an honest empty state ("Not available yet" pre-migration, "No
  re-permission emails sent yet" post-migration-but-zero) in both HTML and text.
- `npx tsc --noEmit` and `npx next build` both pass.
- New/updated unit tests pass; full suite stays green.
- QA smoke passes on `/alerts`, `/aircraft` (unrelated pages, proves no
  regression) — this is a non-visual, internal/email-only change, so screenshots
  are saved but not read per RUNBOOK.
