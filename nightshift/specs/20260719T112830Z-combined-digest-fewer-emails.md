# combined-digest-fewer-emails

## Goal
Give the combined-digest email (2+ due alerts in one send) a "Get fewer emails" footer
link with ladder parity to the single-alert digest, instead of no cadence-down option at all.

## Scope
- `src/lib/alertFrequency.ts` — add a pure `nextLighterFrequency` helper (+ unit tests).
- `src/app/api/alerts/frequency/route.ts` — accept a comma-joined token list (like
  `/api/alerts/unsubscribe`) and a new `dir=step` mode that steps EACH covered alert down
  its own ladder by one rung (daily→weekly, weekly→monthly, monthly untouched) — a single
  combined send can cover alerts at different cadences, so one literal target frequency
  for all of them would be dishonest.
- `src/app/alerts/status/page.tsx` — new `fewer` landing state (generic "fewer emails"
  copy, since the exact per-alert before/after mix can vary) + token-forwarding + Manage
  link, mirroring the existing daily/weekly/monthly blocks.
- `src/lib/email.ts` `buildCombinedAlertDigestEmail` — new optional `frequencyUrl` opt,
  rendered in the footer next to Unsubscribe exactly like the single-alert template's
  existing `frequencyUrl`.
- `src/app/api/cron/alert-digest/route.ts` — wire `frequencyUrl` for the combined send
  path using the already-computed comma-joined `allTokens`, offered only when at least one
  covered alert isn't already monthly.

## Acceptance criteria
- Combined digest footer renders "Get fewer emails" when ≥1 covered alert has cadence
  room to step down; omitted when every covered alert is already monthly.
- Clicking the link steps every covered alert down one rung from ITS OWN current cadence
  (not a single literal target applied to all) — verified via a pure unit test on the new
  `nextLighterFrequency` helper and via direct code read of the route's two-pass update.
- `/alerts/status?state=fewer` renders honest, non-alert-count-specific copy.
- No schema change. `npx next build` + `tsc --noEmit` clean. Full `node --test` suite green
  with new tests for `nextLighterFrequency` and the combined-digest `frequencyUrl` footer
  rendering (present/omitted cases).
- No regression to the existing single-alert `frequencyUrl` behavior (byte-for-byte).

## Out of scope
- Any change to the single-alert digest's existing `frequencyUrl`/`dir` semantics.
- The sibling batch-#10 items (Gmail-clipping guard, re-permission admin line, snooze
  rung) — separate slices.
