# Spec: one-time "widen your alert?" email for never-matched alerts

## Goal
Confirmed alerts that have never matched anything (no digest ever sent) currently
just go silent forever — send exactly ONE honest "hasn't matched yet, widen it?"
email, reusing the already-live `computeWidenCandidate` widen logic, so a
dead-on-arrival alert gets one real chance to become useful instead of silently churning.

## Scope
- `supabase/schema.sql` — additive nullable `alerts.widen_suggested_at timestamptz`
  column (human-apply, same fail-soft precedent as `confirm_reminder_sent_at` etc.).
- `src/lib/email.ts` — new `buildWidenSuggestionEmail()` builder (mirrors
  `buildListingUnavailableEmail`'s structure/cream styling).
- `src/app/api/cron/alert-digest/route.ts` — new `sendWidenSuggestionEmails()`
  function (mirrors `sendStrandedPendingReminders`), called once per cron pass.
  Eligible alert: `status='confirmed'`, `last_digest_at is null` (never sent
  anything, i.e. never matched), `confirmed_at <= now - 21 days`,
  `widen_suggested_at is null`. For each: parse via `parseEditableAlertTarget`,
  re-verify LIVE 0-match via `getAlertMatchCount` on the current source_path,
  compute + re-verify a real >0-match `computeWidenCandidate` via
  `buildAlertCriteriaUpdate` + `getAlertMatchCount` (never send on a guess).
  Send, then stamp `widen_suggested_at` on success (fail-soft: if the column
  isn't migrated live yet, skip sending entirely — same as the reminder pattern).
- Response JSON / log line gains a `widenSuggestionsSent` count.

## Acceptance criteria
- New column added to `schema.sql` with a human-apply note (not run against live DB).
- `buildWidenSuggestionEmail` renders subject/html/text naming the alert's context,
  the widen description (e.g. "Search every state"), and the real re-verified match
  count — never a fabricated number. Links to `/alerts/manage?token=...` (the widen
  nudge already renders there for a still-0-match alert) and includes unsubscribe.
- Cron function only sends to alerts that are genuinely 21+ days old, never sent,
  currently 0 live matches, AND have a real re-verified widened match >0 — skips
  (no send) when any check fails, never guesses.
- Stamped `widen_suggested_at` so it never repeats for the same alert.
- Fails soft (skips, logs a warning) if `widen_suggested_at` isn't migrated live yet —
  no crash, no partial state.
- `npx tsc --noEmit` and `npx next build` pass.
- QA: non-visual (cron/email-builder change, no page/component touched) — smoke gate
  only, screenshots not read.

## Out of scope
- Any UI change to `/alerts/manage` or the existing `WidenAlertNudge` component.
- A one-click "apply this widen from the email" link (would need a new unauthenticated
  server route) — linking to `/alerts/manage` where the same live widen nudge already
  renders is enough for this slice.
- Vercel cron schedule changes (this rides the existing daily `alert-digest` cron).
