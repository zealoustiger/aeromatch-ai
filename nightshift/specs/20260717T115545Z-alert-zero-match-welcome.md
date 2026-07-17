# Honest zero-match welcome email on confirm

## Goal
When a subscriber double-opt-in confirms an alert that currently has zero live matches, send an honest "you're confirmed, we're watching" welcome email instead of silence.

## Scope
- `src/lib/email.ts` — new `buildAlertZeroMatchWelcomeEmail()` builder (mirrors `buildWidenSuggestionEmail`'s structure/tone).
- `src/app/api/alerts/confirm/route.ts` — `sendInstantFirstDigest` currently returns without sending anything when `preview.count === 0`; branch that case to send the new welcome email instead (reusing `getEmptyStateWidenSuggestion` for an optional honest "widen this?" nudge, already re-verified against a live count by that helper).
- `src/lib/email.test.ts` — unit tests for the new builder (with/without widen suggestion, cadence wording, escaping).

## Acceptance criteria
- Confirming a pending alert whose `source_path` resolves (parseable) and currently has 0 live matches now sends exactly one email: the new zero-match welcome, not silence.
- The email never fabricates a match count; if `getEmptyStateWidenSuggestion` returns null (no honest widen candidate), the email renders with no widen section — never a guess.
- Confirming an alert whose `source_path` is unparseable (`preview === null`, e.g. a listing-watch alert) keeps the current behavior — no email sent (unchanged, can't honestly say anything).
- Confirming an alert that already has ≥1 live match keeps sending the existing instant-first-digest email, unchanged.
- No schema change; `last_digest_at` is NOT stamped by the new welcome send, so the normal daily/weekly cron still delivers the first real digest whenever a genuine match later appears (unaffected by this change).
- `npx next build` + typecheck pass; new unit tests pass; QA smoke on `/alerts` (and a live confirm-flow check via a throwaway `@example.com` alert, deleted after) shows no console errors / no overflow.

## Out of scope
- Changing the pre-confirm double-opt-in email's existing zero-match preview line (`buildAlertConfirmEmail`) — already honest, untouched.
- The periodic "hasn't matched in weeks" cron widen-suggestion email (`sendWidenSuggestionEmails`) — untouched, still fires independently later if still zero-match.
- Any new capture point / analytics event.
