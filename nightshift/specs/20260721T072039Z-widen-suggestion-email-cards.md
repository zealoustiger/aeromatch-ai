# widen-suggestion-email-cards

## Goal
Show real matching-listing cards in the "hasn't matched anything yet — widen it?"
email instead of a bare count, so the nudge is as convincing as the digest emails.

## Scope
- `src/lib/email.ts` — `buildWidenSuggestionEmail` gains an optional `samples?:
  AlertDigestSample[]` param, rendered with the existing `sampleCardHtml` partial
  (same pattern `buildAlertConfirmEmail` already uses) in both HTML and text.
- `src/app/api/cron/alert-digest/route.ts` — `sendWidenSuggestionEmails` swaps its
  `getAlertMatchCount(widenedPath)` call for `getAlertDigestPreview(widenedPath, 3)`
  (same underlying query, now also returns samples) and threads `samples` through.
- `src/app/admin/alerts/emails/page.tsx` — preview gallery entry passes real
  `aircraftPreview.samples` so the template gallery shows a live example.
- `src/lib/email.test.ts` — new unit tests for the samples branch.

## Acceptance criteria
- `buildWidenSuggestionEmail` renders sample cards (title/price/photo/link) when
  `samples` is non-empty, in both HTML and plain text.
- Omitting/empty `samples` renders exactly as before (no regression to existing
  tests).
- The cron never pads: sample rows come from the exact same query that already
  verifies `widenCount`, never a separate/looser fetch.
- Sample links carry the `utm_campaign=widen` tag like the rest of the email.
- `/admin/alerts/emails` renders the widen-suggestion preview with real sample
  cards when live aircraft data exists.
- `npx tsc --noEmit` and `npx next build` stay clean; full unit test suite passes.

## Out of scope
- Changing `widenCount`/`widenDescription` logic or `computeWidenCandidate`.
- Sample cards in `buildAlertZeroMatchWelcomeEmail`'s widen block (separate builder).
