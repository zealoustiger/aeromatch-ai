# match-alert-digest

## Goal
Notify partnership/seeker listing owners by email when a genuinely new compatible
listing appears on the other side of the marketplace — the last remaining slice of
the long-running "Compatibility matching engine + new-match alerts" backlog item
(BACKLOG.md ~line 1549), explicitly flagged as "Next" in the last three CHANGELOG
entries (`match-nudge-filtered-href`, `listings-match-badge`, `matches-view`).

## Scope
- Additive schema: `partnerships.match_alert_last_sent_at timestamptz` and
  `partnership_seekers.match_alert_last_sent_at timestamptz` (both nullable) in
  `supabase/schema.sql`, flagged for human application against the live shared DB
  (same pending-migration pattern as `alerts_owner_select` / `threads` columns).
- New `buildMatchAlertEmail()` in `src/lib/email.ts`, mirroring the existing
  `buildAlertDigestEmail()` shape (count + link + unsubscribe-equivalent framing),
  worded for "new matches on your listing" rather than "new search results."
- New cron route `src/app/api/cron/match-alert-digest/route.ts`, mirroring
  `alert-digest/route.ts`'s auth/interval structure:
  - Same `CRON_SECRET` bearer-auth gate.
  - Weekly cadence per listing (7-day window), same as the existing alert digest.
  - Iterates active, human-posted (`poster_id is not null`) partnerships and
    seekers, reuses the already-shipped `getMatchingSeekersForPartnership` /
    `getMatchingPartnershipsForSeeker` (`src/lib/matchingQuery.ts`) — no new
    matching logic — and counts only matches whose OWN `created_at` is on/after
    the listing's last-sent timestamp (or its own `created_at` if never sent).
  - Sends to the listing's own `contact_email` column (already on both tables,
    no user lookup needed) via the existing `sendEmail()`; links to the existing
    `seekerBrowseHrefForPartnership` / `partnershipBrowseHrefForSeeker` filtered
    browse URLs (already built for the on-page match nudges).
  - **Missing-column safety:** if the new column isn't present yet on the live DB
    (migration not yet applied), the route detects the specific "column does not
    exist" error on a cheap pre-check query and returns 200 with a
    `{ skipped: 'migration-pending' }` body, sending nothing — never falls back to
    a behavior that could resend/spam every run.
  - Only advances `match_alert_last_sent_at` for a listing when it actually had
    ≥1 new match this run (mirrors `alert-digest`'s existing behavior of leaving
    `last_digest_at` untouched on a zero-match run).
- `vercel.json`: add a second `crons` entry for `/api/cron/match-alert-digest`
  (same `0 8 * * *` schedule as the existing alert digest).

## Acceptance criteria
- `npx tsc --noEmit` and `npx next build` are clean.
- Hitting the route locally (dev/staging, `CRON_SECRET` unset → unprotected) with
  the real shared DB is **read-only-safe today**: live matches are currently 0 for
  every owner (confirmed in the immediately-prior `matches-view` cycle — the
  travel-radius gate reduces all 10 compatible-on-paper pairs to 0 today), so a
  real run sends 0 real emails; independently unit-verify the "since" filtering
  and email builder against fabricated in-memory rows (not committed) rather than
  relying solely on that fact.
- If the new columns are not yet applied to the live DB, the route responds 200
  with a clear "migration pending" signal and sends nothing (verified directly).
- No UI/page changes in this slice — QA is non-visual (a new API route + schema
  note only); `qa-smoke.mjs` is not applicable (no page route to smoke-test), so
  verification is via direct route invocation + build/typecheck instead.
- BACKLOG.md line ~1549 updated: this cycle closes the "new-match alerts" slice
  (the item's last open piece).

## Out of scope
- Any opt-out UI (mirrors `buildNewMessageEmail`'s existing precedent of
  unprompted-but-relevant transactional email tied to the owner's own listing —
  no opt-in checkbox exists for new-message notifications either).
- Per-listing digest-frequency settings.
- Aircraft-for-sale side (no "matching" concept exists there — this item is
  specific to the partnership/seeker matching engine).
