# admin-alerts-digest-vote-rollup

## Goal
Surface the digest 👍/👎 feedback votes (already captured by `digest-feedback-vote` into
the `feedback` table) as an aggregate rollup on `/admin/alerts`, so the human can see
digest-quality signal without spelunking `/admin/feedback`'s raw list.

## Scope
- `src/lib/alertScoreboard.ts` (or a small new helper in the same file): a
  `getDigestVoteRollup()` read-only query against `feedback` filtered to
  `type = 'digest_vote'` — total 👍/👎 counts, this-week vs last-week counts (mirroring
  the existing `newThisWeek`/`newLastWeek` pattern), and the most recent few votes
  (vote direction + `page_path` alert context + timestamp — no raw email, matching this
  page's existing aggregate-only convention; `/admin/feedback` is where per-row detail
  including email already lives).
- `src/app/admin/alerts/page.tsx`: new "Digest feedback" section rendered alongside the
  existing 3 sections, same visual language (stat pair + list).
- No schema change — reuses the `feedback` table `digest-feedback-vote` already writes to.
- No new capture point, no `alert_subscribed`/analytics change.

## Acceptance criteria
- `/admin/alerts` renders a new "Digest feedback" section showing 👍 vs 👎 totals and a
  this-week/last-week delta, using the same honest empty-state pattern as the other
  sections ("not enough data" when zero votes exist).
- Below a small volume floor (mirror `MIN_ALERTS_TO_SHOW`/`MIN_PLACEMENT_VOLUME_FOR_RATE`
  precedent), never render a misleading percentage — raw counts only until there's enough
  volume.
- A short "recent votes" list (a handful of most recent `digest_vote` rows) shows the vote
  direction and alert context (`page_path`), no raw email.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- `qa-smoke.mjs` passes (HTTP 200, zero console errors, zero horizontal overflow) at
  desktop 1280 + mobile 375 for `/admin/alerts` (anonymous — same admin-gate precedent as
  prior `/admin/alerts` cycles) plus one public page for baseline.
- Backlog item struck off in `BACKLOG.md` on PASS.

## Out of scope
- Any change to how votes are captured (`/api/alerts/digest-feedback` stays untouched).
- Any change to `/admin/feedback`'s per-row list.
- Per-placement (source) breakdown of votes — page-family/aggregate only, this cycle.
