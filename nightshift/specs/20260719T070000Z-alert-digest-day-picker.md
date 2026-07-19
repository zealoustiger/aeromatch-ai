# alert-digest-day-picker

## Goal
Let a weekly-cadence alert subscriber pick which day of the week their digest arrives on,
instead of the current "whenever 7 days have elapsed since the last send" drift (BACKLOG.md
plan-pass batch #7, `[P2][goal]`, the one remaining unstruck item in that batch).

## Scope
- `supabase/schema.sql` — additive `alerts.digest_day` migration (nullable `smallint`, 0=Sun..
  6=Sat, `check (digest_day between 0 and 6)`), appended at the end following the exact
  `-- ⚠️ HUMAN ACTION REQUIRED` comment convention every prior `alerts.*` column uses.
- `src/lib/alertFrequency.ts` — `isDigestDue` gains an optional 4th param `digestDay: number |
  null | undefined`; when the alert is `weekly` and a valid `digestDay` is present, gate on
  "today's UTC weekday matches AND at least 6 days have elapsed since the last send" instead of
  the plain 7-day elapsed check (prevents both same-week double-sends and drift). Falls back to
  today's pure elapsed-days behavior when `digestDay` is null/undefined (unmigrated DB or no
  preference set) — a weekly alert is never silently skipped. New `normalizeDigestDay(value):
  number | null` helper. `describeLastDigest` gets an optional digestDay param to say e.g.
  "checks weekly, Saturdays" when set.
- `src/components/FrequencyToggle.tsx` — when the alert's cadence is `weekly`, render a small
  `<select>` (Sun–Sat) next to the existing toggle button, defaulting to "no preference," plus
  the honest copy "we send around 8:00 UTC." Hidden entirely when cadence is `daily`.
- `src/app/actions.ts` — new `updateAlertDigestDay(id, digestDay, token)` server action,
  mirroring `updateAlertFrequency`'s ownership proof (`loadOwnedAlert`) and single-column
  fail-soft retry (no-op success on a `digest_day`-missing error, never a scary error for an
  inert pre-migration toggle).
- `src/lib/alertsForOwner.ts` — add `'digest_day'` to `fetchAlertsForEmail`'s `OPTIONAL_COLS`
  (also covers the export variant, which spreads the same array) so `/alerts/manage` can read
  and display the current selection.
- `src/app/api/cron/alert-digest/route.ts` — add `'digest_day'` to `DIGEST_OPTIONAL_COLS` and
  pass `alert.digest_day` into the existing `isDigestDue` call site.
- `src/app/alerts/manage/page.tsx` — thread `a.digest_day` into `FrequencyToggle` and
  `describeLastDigest`.
- Unit tests in `src/lib/alertFrequency.test.ts` for the new day-gating branch of `isDigestDue`
  and `normalizeDigestDay`.

## Acceptance criteria
- `isDigestDue(lastDigestAt, 'weekly', nowIso, digestDay)`: due only when elapsed ≥ 6 days AND
  `new Date(nowIso).getUTCDay() === digestDay`; with `digestDay` null/undefined, behaves exactly
  as before (elapsed ≥ 7 days); `daily` frequency is completely unaffected by the new param.
- Never-sent (`lastDigestAt === null`) alerts stay always-due regardless of `digestDay`.
- The day `<select>` only renders when the toggle shows "Weekly"; switching to "Daily" hides it
  without deleting the stored preference.
- `updateAlertDigestDay` no-ops with `{ ok: true }` (not an error) when the column isn't
  migrated yet, same as `updateAlertFrequency`.
- The cron's due-check still runs correctly (no crash, no dropped digest) whether or not
  `digest_day` exists on the live table.
- `npx tsc --noEmit` and `npx next build` both pass; full existing test suite plus new cases
  passes.

## Out of scope
- Any change to the subscribe/capture form (`subscribeToAlerts`) — this is edit-only, no new
  capture point, per the backlog item's own text.
- `src/app/api/alerts/frequency/route.ts` (the token-scoped GET-link flip) — untouched.
- Actually applying the migration against live Supabase (human action, same as every prior
  `alerts.*` column).
