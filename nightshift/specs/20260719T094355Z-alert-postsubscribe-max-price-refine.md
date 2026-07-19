# Post-subscribe one-tap refine — optional "max price" in the success panel

## Goal
Let a visitor who just subscribed to an aircraft alert optionally tighten it with a max
price, right in the success panel, without a second `alert_subscribed` event or a trip to
`/alerts/manage`.

## Scope
- `src/app/actions.ts`: `subscribeToAlerts` returns a `token` (the row's own
  `unsubscribe_token`) on a genuinely-new insert (omitted on the idempotent `23505` path).
  New `refineAlertMaxPrice(sourcePath, maxPrice, token?)` server action — resolves the
  owner via `resolveOwnerEmail` (token for anon/one-tap, session for signed-in), looks up
  the alert by `(email, source_path)` (the same unique pair `subscribeToAlerts` already
  relies on), and reuses `parseEditableAlertTarget`/`buildAlertCriteriaUpdate`/
  `targetToFields` (already imported, same helpers `updateAlertCriteria` uses) to layer a
  `maxPrice` onto the row's existing criteria — never dropping make/model/state/minPrice/
  dealOnly in the process. Only edits `type === 'aircraft'` rows (honesty gate — legacy
  path-segment alerts aren't editable, same restriction as `/alerts/manage`'s Edit form).
- `src/components/AlertSignup.tsx`: after a successful subscribe (typed-email, one-tap
  remembered-email, or signed-in one-click), when the just-subscribed alert is an
  aircraft-type, query-string `source_path` with no `max_price` already set, and isn't a
  `watchOnly` box (which has its own target-price field), show one optional "Cap it at a
  max price?" input + Save button in the success panel. Saving calls
  `refineAlertMaxPrice` and swaps to a small "Got it — capped at $X" confirmation. Skipping
  it (never touching the input) leaves the just-created alert exactly as submitted.

## Acceptance criteria
- Subscribing to an aircraft alert whose `source_path` is `/aircraft?...` with no
  `max_price` shows the optional max-price input in the success panel (typed-email path,
  one-tap remembered-email path, and signed-in one-click path).
- Entering a value and clicking Save updates the alert's stored `source_path`/`context`
  to include `max_price` while preserving every other existing criterion (make/model/
  state/min_price/deal) — verified by reading the row back.
- Leaving the input blank never blocks or alters the success state — the alert stays
  exactly as originally submitted (no silent second write).
- The input does NOT render for: partnership/seeker alerts, `watchOnly` boxes, alerts
  whose `source_path` isn't the modern `/aircraft?...` query-string shape (e.g. curated
  make/model pages), or an alert that already has `max_price` set.
- No new `alert_subscribed` event fires from the refine action (row already exists —
  this is an UPDATE, not a second subscribe).
- `npx next build` + `tsc --noEmit` pass; existing alert-related unit tests still pass.

## Out of scope
- The other batch #9 items (watched-listing-unavailable "alert me about similar",
  bounced-heads-up parity on resend, dormant-subscriber re-permission email).
- Any refine option beyond max price (e.g. min price, model) — one optional field, per
  the item's own scoping.
- Refining an alert whose `source_path` is a legacy/curated path (not query-string
  `/aircraft?...`).
