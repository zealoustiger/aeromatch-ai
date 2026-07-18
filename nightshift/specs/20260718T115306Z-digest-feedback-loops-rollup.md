# digest-feedback-loops-rollup

## Goal
Surface the two "deaf" alert-digest feedback signals — per-listing "Not relevant?"
votes and the instant-alerts interest tap — in the Monday admin alert-funnel email
(and mirror onto `/admin/alerts`) so the human can finally see the demand data that's
already being collected but never read.

## Scope
- `src/lib/alertScoreboard.ts` — add `getNotRelevantListingsRollup(now)` (top ~5
  `digest_listing_vote` targets this week, with counts + page path/title) and
  `getInstantInterestRollup(now)` (this-week / all-time `instant_alert_interest`
  tap counts).
- `src/lib/alertFunnelWeekly.ts` — wire both rollups into
  `AlertFunnelWeeklySnapshot`.
- `src/lib/email.ts` — render a "Least relevant listings this week" section and an
  "Instant-alerts interest" line in `buildAdminAlertFunnelEmail` (HTML + text),
  honest empty states, never a fabricated 0.
- `src/app/admin/alerts/page.tsx` — mirror both as small sections (trivial addition,
  same page already reads `getDigestVoteRollup`).
- `src/lib/email.test.ts` — new coverage for both sections + their empty states.

## Acceptance criteria
- `getNotRelevantListingsRollup` groups `feedback` rows where
  `type='digest_listing_vote'` and `created_at` is within the last 7 days by
  `page_path`, returns the top 5 by count with a human-readable title (derived
  from the existing `Not relevant: <title>` message, never fabricated).
- `getInstantInterestRollup` returns real this-week and all-time counts of
  `feedback` rows where `type='instant_alert_interest'` — zero when none exist,
  never a guessed number.
- `buildAdminAlertFunnelEmail` renders both new sections in HTML and text, with an
  explicit "no votes yet" / "no interest recorded yet" empty state when a rollup is
  empty — mirrors the existing `digestFeedbackHtml`/`emailEngagementHtml` pattern.
- `/admin/alerts` shows the same two rollups (small addition, reuses existing
  section styling) — non-blocking if it turns out non-trivial, email is the
  required surface per the backlog item.
- `npx tsc --noEmit` and `npx next build` both pass; full `node --test` suite
  passes with new tests covering both sections' present + empty-state rendering.
- No schema change, no new capture point — both signals already write to the
  existing `feedback` table.

## Out of scope
- Any change to how `digest_listing_vote` / `instant_alert_interest` rows are
  written (those flows already ship and work).
- Email engagement attribution (`recipient` linkage) — separate batch #7 item,
  needs a human-applied migration.
- Digest-cron reliability line — separate batch #7 item.
