# admin-digest-vote-counts

## Goal
Surface the digest 👍/👎 feedback vote counts (this week vs last week) in the Monday admin alert-funnel email, so the loop actually reads the one direct quality signal subscribers send back.

## Scope
- `src/lib/alertFunnelWeekly.ts` — add `digestVotesUpThisWeek`/`digestVotesDownThisWeek`/`digestVotesUpLastWeek`/`digestVotesDownLastWeek`/`digestVotesUpTotal`/`digestVotesDownTotal` to `AlertFunnelWeeklySnapshot`, computed via the existing `getDigestVoteRollup()` (`src/lib/alertScoreboard.ts`) — no new query logic, no schema change.
- `src/lib/email.ts` — `buildAdminAlertFunnelEmail`: add a "Digest feedback" row/section (👍/👎 counts this week, WoW delta, honest "no votes yet" state when both totals are 0).
- `src/lib/email.test.ts` — extend `ADMIN_FUNNEL_BASE` fixture + new tests for the vote-count row and the zero-votes state.

## Acceptance criteria
- `getAlertFunnelWeeklySnapshot()` returns real up/down vote counts (this week + last week), sourced from the `feedback` table via `getDigestVoteRollup()` — no fabricated numbers.
- `buildAdminAlertFunnelEmail` renders a "Digest feedback" line showing 👍 N / 👎 N this week with a week-over-week delta, in both HTML and plain-text.
- When there are zero votes ever recorded, the email shows an explicit "No votes yet" line — never a blank gap or a fabricated 0% rate.
- No schema change (reuses the existing `feedback` table + `digest_vote` type already written by `/api/alerts/digest-feedback`).
- `npx tsc --noEmit` and `npx next build` both pass; `node --test` suite passes including new tests.
- QA: this is a non-visual, internal-email-only change (no rendered page changes) — smoke-test the pages the cron route's other output touches only if any user-facing route changed (none expected); otherwise confirm via `next build` + unit tests + a curl of the dev email-preview endpoint.

## Out of scope
- The "narrow this alert?" nudge (separate open `[P2][goal]` item).
- Any change to the `/admin/alerts` page's existing vote-rollup UI (already shipped).
- Per-page-path breakdown of votes in the email (keep it to a single aggregate line).
