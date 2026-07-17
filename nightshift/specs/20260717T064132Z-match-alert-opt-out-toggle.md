# match-alert-opt-out-toggle

## Goal
Give partnership/seeker owners a way to pause the weekly `match-alert-digest` email
directly from `/listings`, next to the existing read-only "We email you when new
matches appear" disclosure line.

## Scope
- `src/lib/types.ts` — add `match_alert_opt_out: boolean | null` to `Partnership` and
  `PartnershipSeeker`.
- `src/app/listings/page.tsx` — extend `selectActiveWithMatchAlertFallback`'s column
  cascade to also try selecting `match_alert_opt_out` (3-tier fallback: both optional
  columns → `match_alert_last_sent_at` only → neither, since the two columns may be
  migrated independently); render a new `MatchAlertOptOutToggle` next to
  `MatchAlertDisclosure` for both partnership and seeker rows.
- `src/app/actions.ts` — new `updateMatchAlertOptOut(type, id, optOut)` server action:
  session-based ownership check (`eq('poster_id', user.id)`, same shape as
  `deactivateListing`/`relistListing`), updates `match_alert_opt_out`, fail-soft no-op
  if the column isn't migrated yet (same convention as `updateAlertPriceDropOptIn`).
- `src/components/MatchAlertOptOutToggle.tsx` — new client component, modeled on
  `PriceDropToggle.tsx` (optimistic local state + `useTransition`, revert on error).
- `src/app/api/cron/match-alert-digest/route.ts` — both `processPartnerships` and
  `processSeekers` already `select('*')`, so `match_alert_opt_out` comes back for free
  when the column exists and is simply `undefined` when it doesn't (no query-level
  filter needed, so no new 42703 branch to add). Skip a row if
  `row.match_alert_opt_out === true` before sending, counting it toward `skipped`.

## Acceptance criteria
- `/listings` shows a small "Pause these emails" / "Paused — resume" toggle next to the
  match-alert disclosure line on every active/pending partnership and seeker row (not on
  aircraft-for-sale rows, which never get this email).
- Clicking the toggle persists via `updateMatchAlertOptOut`, flips instantly (optimistic),
  and reverts on a genuine error; a missing-column DB no-ops silently (same UX as
  `PriceDropToggle` pre-migration).
- The cron (`processPartnerships`/`processSeekers`) skips any row with
  `match_alert_opt_out === true` and does not send it an email.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- No new console errors, no horizontal overflow at 1280/375 on `/listings` (behind auth —
  smoke-tested via the anonymous `/auth?next=/listings` redirect, same as the prior
  `listings-match-alert-disclosure` cycle).
- No schema migration executed by this cycle — additive column referenced defensively,
  exactly like `match_alert_last_sent_at` before it (human runs the actual `ALTER TABLE`
  later; code fails soft either way).

## Out of scope
- Actually running the `ALTER TABLE ... ADD COLUMN match_alert_opt_out` migration (human
  DDL call, per BACKLOG's own flag on this item).
- Any change to aircraft-for-sale rows (no match-alert email exists for that type).
- Any change to the `/alerts/manage` page or the anonymous-alerts `frequency`/price-drop
  toggles (unrelated system, already has its own pause/resume/frequency controls).
