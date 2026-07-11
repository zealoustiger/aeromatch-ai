# Alert social-proof count on capture forms

## Goal
Show a real, honesty-gated "N buyers get alerts for this model" line on the aircraft
listing-detail and make/model alert-capture forms, and include the count in the
`alert_subscribed` analytics payload so its lift on conversion is measurable.

## Scope
- New `src/lib/alertCounts.ts` — `getAlertCounts(contexts, minToShow?)`, a read-only
  batch query over the `alerts` table (service-role client, mirrors `saveCounts.ts`'s
  `getSaveCounts`), counting `status='confirmed'` rows grouped by exact `context` string.
  `MIN_ALERTS_TO_SHOW = 3` (below this the signal is too thin — no fabricated numbers,
  matches `MIN_SAVES_TO_SHOW`'s honesty-gate pattern).
- `src/components/AlertSignup.tsx` — new optional `alertCount?: number` prop. When
  present and `>= MIN_ALERTS_TO_SHOW` (checked in the component so callers can pass the
  raw count), render a small social-proof line near the headline ("🔔 N buyers get
  alerts for {context}"). Include `alert_count` in the `alert_subscribed` `track()` call
  whenever the count was shown.
- `src/app/aircraft/[make]/[model]/page.tsx` — fetch the count for `label` (the same
  string already passed as `context`) and pass it into the existing `AlertSignup`.
- `src/app/aircraft/listing/[id]/page.tsx` — fetch the count for the same make+model
  string already passed as `context` and pass it into the existing `AlertSignup`.

## Out of scope
- Any other `AlertSignup` call site (partnerships, seekers, state/airport pages,
  homepage, `/alerts` landing) — backlog item names only the listing-detail and
  make/model blocks.
- Any schema/migration change — `alerts.context`/`status` already exist.
- Changing the alert capture UX/copy beyond the new count line.

## Acceptance criteria
- `getAlertCounts` returns real counts from `alerts` (`status='confirmed'`, grouped by
  exact `context`), fails soft to an empty map on any error (no page breakage).
- The count line renders ONLY when the real count is `>= 3`; renders nothing below that
  (no placeholder/zero state), same honesty floor as `MIN_SAVES_TO_SHOW`.
- `/aircraft/[make]/[model]` and `/aircraft/listing/[id]` both pass a real count into
  `AlertSignup`; no other page's `AlertSignup` call site changes.
- Submitting the alert form emits `alert_subscribed` with an `alert_count` field when
  the social-proof line was shown.
- `npx next build` (typecheck + build) is clean.
- QA smoke passes (HTTP 200, no console errors, no horizontal overflow) at desktop 1280
  + mobile 375 on a make/model page and a listing-detail page.
