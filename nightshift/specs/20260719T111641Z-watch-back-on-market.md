# watch-back-on-market

## Goal
When a listing-watch alert was auto-paused because its aircraft/partnership went
unavailable, and that listing later comes back to `status='active'` (sale fell through,
owner relisted), send the one subscriber who proved they wanted exactly that listing a
"It's back on the market" email and resume their watch — instead of leaving them
permanently unsubscribed from the exact thing they cared about.

## Scope
- `supabase/schema.sql` — additive `alerts.unavailable_notified_at timestamptz` column
  (⚠️ human-apply, fail-soft like every prior `alerts.*` migration), documented with the
  same comment-block convention as `paused_at`/`repermission_sent_at` etc.
- `src/app/api/cron/alert-digest/route.ts`:
  - Stamp `unavailable_notified_at` alongside the existing `status:'paused'` update in
    the unavailable-watch loop (fail-soft: retry without the column if not migrated,
    same pattern the existing `paused_at` retry already uses).
  - New `resolveBackOnMarket` helper — checks whether a given aircraft/partnership row is
    `status==='active'` again.
  - New `getBackOnMarketCandidates` — fetches `alerts` rows with `status='paused'` AND
    `unavailable_notified_at IS NOT NULL` (fails soft to `[]` if the column doesn't exist
    live yet — never guesses).
  - New `sendBackOnMarketNotices` — for each candidate whose watched listing is active
    again, sends the new email and resumes the alert (`status:'confirmed'`, clears
    `unavailable_notified_at`, stamps `last_digest_at`). Called once per cron run,
    alongside the existing Monday-summary / repermission calls.
- `src/lib/email.ts` — new `buildListingBackOnMarketEmail` builder, mirroring
  `buildListingUnavailableEmail`'s shape/copy conventions (aircraft vs. partnership noun).
- Unit tests for the new email builder (`email.test.ts`) and any pure logic extracted.

## Acceptance criteria
- A paused watch alert whose `unavailable_notified_at` is set and whose target listing
  is back to `status='active'` gets exactly one "back on the market" email, and its row
  flips back to `status='confirmed'` with `unavailable_notified_at` cleared.
- A **user-initiated** pause (via `pauseAlert`/`snoozeAlert`) never has
  `unavailable_notified_at` set, so it is never touched by this new resume logic —
  confirmed by code read (only the cron's auto-pause path sets the new column).
- If the listing is still unavailable, nothing sends and the alert stays paused.
- Missing `unavailable_notified_at` column (not yet migrated) → the whole check fails
  soft to a no-op, identical to today's behavior; no cron error.
- `npx next build` + `tsc --noEmit` pass; existing `email.test.ts`/alert-digest tests
  pass unchanged; new unit tests cover the new email builder.
- QA: production build smoke on `/alerts`, `/aircraft` (non-visual — no page markup
  changes, cron/email-template internals only).

## Out of scope
- Bundling this notice into the combined-digest template (kept as its own dedicated
  email, same precedent as the original unavailable-watch notice).
- The "Get fewer emails" combined-digest ladder-parity item (separate batch #10 slice).
- Backfilling `unavailable_notified_at` for already-paused rows from before this ships
  (only newly-auto-paused rows going forward get the stamp; that's an honest gap, not a
  bug — no historical data to backfill from).
