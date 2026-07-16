# listings-match-alert-disclosure

## Goal
Disclose on `/listings` that the automatic weekly "new matching pilots/partnerships" owner
email exists, so owners aren't surprised by an email they were never told about (GOAL.md's
never-spam/honesty rule) — and so owners who haven't gotten one yet learn the feature exists.

## Scope
- `src/app/listings/page.tsx` — the only file. Add a fail-soft select of
  `match_alert_last_sent_at` on the active `partnerships` and `partnership_seekers`
  queries (mirrors the existing 42703 fallback pattern used elsewhere in the codebase,
  e.g. `src/app/partnerships/[id]/page.tsx`), then render one honest line per
  partnership/seeker row: "We email you when new matching pilots/partnerships appear —
  last sent {date}" or "— none sent yet" when null, linking to the same match-browse URL
  the row's `MatchCountBadge` already uses.
- Aircraft-for-sale rows are NOT touched — the `match-alert-digest` cron only processes
  `partnerships` and `partnership_seekers` (confirmed by reading
  `src/app/api/cron/match-alert-digest/route.ts`); `AircraftForSale` has no
  `match_alert_last_sent_at` column in `types.ts`, so adding the line there would be
  either dishonest or need new backend work — out of scope.
- Past (sold/closed) listings sections are NOT touched — they're already excluded from
  the cron (`status='active'` only), so a disclosure line there would be misleading.

## Acceptance criteria
- `/listings` (signed-in, at least one active partnership or seeker listing) shows a
  small honest disclosure line under each active partnership/seeker row.
- The line never fabricates a date — renders "none sent yet" whenever the column is
  null OR unavailable (42703 fallback), never a guessed timestamp.
- The line links to the same browse URL as the row's existing match-count badge.
- Aircraft-for-sale rows and past/closed listings are visually unchanged.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- QA smoke passes on `/listings` at desktop 1280 + mobile 375 (HTTP 200 — expect a
  redirect to `/auth?next=/listings` since it requires a signed-in session, so smoke
  will validate the redirect target's HTTP status; visually confirm via a signed-in
  screenshot if feasible, otherwise confirm via code read + build since the page is
  auth-gated).

## Out of scope
- No opt-out toggle (flagged in BACKLOG as the natural next slice).
- No change to aircraft listings or the cron itself.
- No schema change (column already exists in `types.ts`; DDL status unknown on live DB,
  handled via the existing fail-soft retry convention).
