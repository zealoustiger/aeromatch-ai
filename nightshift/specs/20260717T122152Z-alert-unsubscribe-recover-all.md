# alert-unsubscribe-recover-all

**Goal:** A combined-digest unsubscribe click kills every alert it covered, but the
"switch to weekly / snooze / pause instead" recovery box on `/alerts/status` only ever
rescues the FIRST of the N unsubscribed alerts — forward and apply the recovery to all of
them, with honest count copy.

**Scope:**
- `src/app/api/alerts/unsubscribe/route.ts` — forward the full comma-separated token list
  to `/alerts/status`, not just the first token.
- New `src/lib/alertTokenList.ts` — pure helper to parse/dedupe a comma-separated token
  string (shared by the route's existing `applyUnsubscribe` and the actions below).
- `src/app/actions.ts` — `pauseAlertByToken`, `snoozeAlertByToken`,
  `updateAlertFrequencyByToken`, `markAlertFoundAircraftByToken`: accept a comma-separated
  token list, apply to every matching alert (`.in()` instead of `.eq()`), return the
  affected count.
- `src/app/alerts/status/page.tsx` — look up all alerts matching the token list (not just
  one) to compute an honest count + whether any are on daily frequency.
- `src/components/UnsubscribeRecover.tsx` — accept an `alertCount` prop, adjust copy to
  say "all N of your alerts" when count > 1 (unchanged singular copy at count 1).

**Acceptance criteria:**
- A single-alert unsubscribe link (today's common case) behaves byte-for-byte identically
  — same copy, same single-row DB update.
- A combined-digest unsubscribe (multiple comma-separated tokens) that lands on
  `/alerts/status` and clicks "Pause instead" (or snooze / switch to weekly) flips
  **every** covered alert, not just the first.
- The recovery box copy honestly names the count ("Pause all 3 of your alerts instead of
  unsubscribing completely") when count > 1.
- No schema/migration change — reuses existing `unsubscribe_token`/`status`/`frequency`
  columns exactly as today.
- `next build` + typecheck clean; QA smoke passes on `/alerts/status`.

**Out of scope:**
- Changing what triggers a combined digest or how `alert-digest` groups alerts.
- The `/alerts/manage` page (already fully multi-alert; unaffected).
- Any new capture point or `alert_subscribed` event change.
