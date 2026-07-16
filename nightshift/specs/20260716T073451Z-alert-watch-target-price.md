# Target-price watch alerts

## Goal
Let a "watch this listing's price" alert (aircraft or partnership) subscriber set an
optional target price so they're only emailed once the price actually drops to or below
what they'd pay, instead of on every drop no matter how small.

## Scope
- `supabase/schema.sql` — additive `alerts.target_price` numeric column (human-apply,
  fail-soft, same precedent as `paused_until`/`price_drop_opt_in`).
- `src/app/actions.ts` — `subscribeToAlerts` + `subscribeSignedInAlert` accept an optional
  `targetPrice` param, persisted with the same graceful-fallback insert-retry pattern as
  every other optional `alerts.*` column.
- `src/components/AlertSignup.tsx` — when `watchOnly`, show an optional "Only email me
  once it drops to $X or below" number field (blank = any drop, current behavior). Wired
  into all three submit paths (typed email, one-tap remembered email, signed-in) and the
  `alert_subscribed` event (`has_target_price` flag only — never the raw dollar figure,
  consistent with how other optional fields are logged).
- `src/lib/alertsForOwner.ts` — add `target_price` to the owner-facing `AlertRow`/
  `OPTIONAL_COLS` graceful-fallback fetch (powers both `/alerts/manage` and `/account`).
- `src/app/alerts/manage/page.tsx` — watch rows with a `target_price` set show an honest
  "watching for ≤ $X" line instead of just "Watching: {label} — $Y today".
- `src/app/api/cron/alert-digest/route.ts` — `resolveListingWatch`/`resolvePartnershipWatch`
  take the alert's `target_price`; a genuine drop only fires when there's no target OR the
  new price is at/below it (still requires `hasRecentPriceDrop` — a target above the
  current price does NOT retroactively fire without an actual drop). `DigestAlertRow`
  fetch gets `target_price` added to its own graceful-fallback column list.

## Out of scope
- Editing `target_price` after signup via `AlertEditForm` — watch alerts aren't wired into
  the `EditableAlertTarget`/`buildAlertCriteriaUpdate` machinery at all today (edit-form
  support is family-search-only); adding that is a real follow-up slice, not this one.
- Non-watch (family-search) price-drop alerts — those already fire on ANY drop with no
  price floor concept; this item is specifically the single-listing "watch" flow per the
  backlog description.

## Acceptance criteria
- Typecheck/build green.
- The watch-only capture panel (bell icon on cards, dedicated watch box on listing/
  partnership detail pages) renders an optional target-price field with honest copy;
  leaving it blank preserves today's "alert on any drop" behavior byte-for-byte.
- A subscribed watch alert with a target price shows "watching for ≤ $X" on
  `/alerts/manage`.
- Cron: a watch alert with a target price above the current live price does NOT fire even
  on a genuine drop that stays above the target; one that drops to/below the target does.
- No schema/DB write happens against the live DB during QA — verified via code read +
  local build/smoke only (no signup round-trip needed since this is additive-column,
  fail-soft, same as every prior `alerts.*` slice).
