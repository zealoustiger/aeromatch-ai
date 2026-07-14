# One-click digest feedback — "Was this digest useful? 👍/👎"

## Goal
Add a one-click 👍/👎 footer link to the alert digest emails so subscribers can tell us
whether a send was useful, closing the loop on "best alert email in aviation" with real
per-send feedback instead of guesswork — and route a 👎 to an offer of fewer emails
instead of a dead end (GOAL.md).

## Scope
- `src/lib/email.ts` — `buildAlertDigestEmail` + `buildCombinedAlertDigestEmail` gain
  optional `digestFeedbackUpUrl`/`digestFeedbackDownUrl` params; when both present,
  render a small "Was this digest useful? 👍 👎" footer row (HTML + text), same style
  precedent as the existing `frequencyUrl` "Get fewer emails" link.
- `src/app/api/alerts/digest-feedback/route.ts` (new) — GET-only, mirrors
  `/api/alerts/unsubscribe`'s structure: resolves the alert by `unsubscribe_token`
  (service role), inserts one row into the existing `feedback` table
  (`type: 'digest_vote'`, `message`, `email`, `page_path`), redirects to
  `/alerts/status?state=digest_feedback_up|down&token=...`. No schema change — reuses
  the existing `feedback` table (no CHECK constraint on `type`, confirmed in
  `supabase/schema.sql`).
- `src/app/alerts/status/page.tsx` — two new `STATES` entries
  (`digest_feedback_up`/`digest_feedback_down`) with a "Manage your alerts" link (reuses
  the existing token-scoped `/alerts/manage` link pattern already used by the `weekly`
  state) so a 👎 offers "fewer emails" (switch cadence / pause / edit) instead of a dead
  end.
- `src/app/admin/feedback/page.tsx` — add a `digest_vote` entry to `TYPE_META` (👍/👎
  icon) so votes are legible in the existing admin feedback inbox (no new page, no auth
  change).
- `src/app/api/cron/alert-digest/route.ts` — compute the two feedback URLs from the
  already-in-scope `unsubToken` (single-alert path) / `firstToken` (combined path) and
  thread them into both builder calls.
- `src/lib/email.test.ts` — new unit tests for the footer row (present/absent).

## Out of scope
- `buildPriceDropEmail` (rich single-listing template) and
  `buildListingUnavailableEmail` — feedback stays scoped to the two aggregate digest
  templates this cycle.
- Any admin analytics on vote counts beyond the existing feedback inbox list.
- Any change to send cadence/matching logic itself.
- No live cron/Resend send triggered during QA (shared prod DB/Resend key — same
  precedent as every prior digest-email cycle); verify via unit tests + dev-preview
  fixture + direct route hit with a throwaway `@example.com` token.

## Acceptance criteria
- [ ] `buildAlertDigestEmail`/`buildCombinedAlertDigestEmail` render the 👍/👎 footer row
      only when both URLs are supplied; byte-identical output when omitted (existing
      call sites/tests unaffected).
- [ ] `GET /api/alerts/digest-feedback?token=<real>&vote=up|down` inserts a `feedback`
      row and redirects to the correct status state; a bad/missing token or vote
      redirects to `invalid`.
- [ ] `/alerts/status?state=digest_feedback_down&token=...` shows a "Manage your alerts"
      link (fewer emails / pause), not a dead end.
- [ ] `npx tsc --noEmit` and `npx next build` both clean.
- [ ] `node --experimental-strip-types --test src/lib/email.test.ts` all pass.
- [ ] `qa-smoke.mjs` passes on `/alerts/status`, `/alerts/manage`, `/aircraft` (desktop
      1280 + mobile 375, zero console errors, zero overflow).
