# digest-snooze-link

## Goal
Add a one-click, tokenized "Snooze 30 days" link to the digest email footer (single-alert
and combined) so a subscriber going on vacation / mid-purchase can pause without clicking
through to `/alerts/manage` — mirroring the existing "Get fewer emails" (`frequencyUrl`) link.

## Scope
- `src/app/actions.ts` — new `resumeAlertsByToken(token)` server action (token-list scoped,
  mirrors `snoozeAlertByToken`'s trust boundary) so the new landing state can offer a real
  one-tap "Undo — resume now."
- `src/app/api/alerts/snooze/route.ts` — new GET-only route: `?token=<unsubscribe_token(s)>`
  calls the existing `snoozeAlertByToken` action, redirects to `/alerts/status?state=snoozed`
  (or `invalid` on failure), same pattern as `/api/alerts/frequency`.
- `src/lib/email.ts` — `buildAlertDigestEmail` and `buildCombinedAlertDigestEmail` gain an
  optional `snoozeUrl` param, rendered as a third/fourth quiet footer link next to
  "Get fewer emails", both html + text.
- `src/app/api/cron/alert-digest/route.ts` — compute `snoozeUrl` for both the single-alert
  and combined send paths (token-gated, same graceful `unsubToken`-present check as
  `frequencyUrl`) and pass it through.
- `src/app/alerts/status/page.tsx` — new `snoozed` state: honest resume-date copy (looked up
  server-side from the token's `paused_until`, falls back to generic "paused" wording if the
  column isn't migrated/null — never fabricates a date), a new `SnoozeUndo` client component
  offering one-tap "Undo — resume now," and the standard "Manage your alerts" link.
- `src/components/SnoozeUndo.tsx` — new small client component (button → `resumeAlertsByToken`
  → inline "You're resumed" confirmation), same shape as `UnsubscribeRecover`'s per-action flow.
- Unit tests: `resumeAlertsByToken`-adjacent existing coverage pattern is action-level and
  already exercised indirectly; add email-builder tests for the new footer link (present /
  omitted) mirroring the existing `frequencyUrl` test pairs.

Out of scope (explicitly, keep this cycle small): `buildPriceDropEmail`'s footer (the rich
single-drop template) — not touched this cycle, flagged as a follow-up. No schema change —
reuses the existing `paused_until`/`paused_at` columns from `snoozeAlert`/`snoozeAlertByToken`.

## Acceptance criteria
- A GET to `/api/alerts/snooze?token=<valid unsubscribe_token>` snoozes that alert (or every
  alert in a comma-joined token list) for 30 days and redirects to
  `/alerts/status?state=snoozed&token=...`; an invalid/missing token redirects to `invalid`.
- `/alerts/status?state=snoozed` renders on-brand, names the real resume date when available,
  offers a working "Undo — resume now" (calls `resumeAlertsByToken`, flips the alert(s) back
  to `status: 'confirmed'`), and links to `/alerts/manage`.
- `buildAlertDigestEmail`/`buildCombinedAlertDigestEmail` render the "Snooze 30 days" footer
  link only when `snoozeUrl` is passed; both html and text parts.
- The alert-digest cron passes a real `snoozeUrl` on both the single-alert and combined send
  paths whenever the alert(s) have an `unsubscribe_token`.
- `npx next build` + `tsc --noEmit` pass; full unit suite passes; new tests cover the footer
  link presence/absence.
- QA: production build smoke-tested on `/alerts/status` (+ existing `/alerts` pages) at
  desktop 1280 + mobile 375, zero console errors, zero horizontal overflow; live-verify the
  snooze + undo route against a throwaway `@example.com` alert row, delete it after.

## Out of scope
- `buildPriceDropEmail` footer parity (follow-up).
- Any change to the snooze duration (stays the fixed 30 days `resolveSnoozeUntil` already uses).
- Any change to `/alerts/manage`'s existing snooze button/flow.
