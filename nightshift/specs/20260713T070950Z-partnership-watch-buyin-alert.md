# partnership-watch-buyin-alert

## Goal
Add a "watch this partnership" buy-in-drop alert on `/partnerships/[id]`, giving
partnership listings the same single-item watch alert the aircraft listing page
already has (`listing-watch-price-alert`) — the last open `[P1][goal]` item in
BACKLOG.md's 🔔 refill #8 queue.

## Scope
- `src/components/AlertSignup.tsx` — make the `watchOnly` copy (headline/subcopy/
  done-copy/button label) noun-aware so a partnership watch box reads "buy-in"
  instead of "price" (currently hardcoded to aircraft wording).
- `src/app/partnerships/[id]/page.tsx` — render a second, watch-only `AlertSignup`
  below the existing family-search box, `sourcePath=/partnerships/<id>?watch=price`,
  `source=partnership_watch`, `noun=partnership`.
- `src/app/api/cron/alert-digest/route.ts` —
  - extend the `partnership` `AlertTarget` variant with an optional `listingId`.
  - `resolveTarget`: recognize `/partnerships/<id>?watch=price` (checked after the
    existing near/make/state/seeking exact-path matchers, before the bare
    `/partnerships` fallback).
  - new `resolvePartnershipWatch` (partnership counterpart of `resolveListingWatch`):
    resolve the row, report `unavailable` when not `status: 'active'`, else check
    for a genuine buy-in drop since `since` via `hasRecentPriceDrop` against
    `previous_buy_in_price`/`buy_in_price_changed_at` — graceful-degrade (retry
    without those two columns) while that pair is still pending live DDL, same
    precedent as `countRecentPartnershipPriceDrops`.
  - wire `target.type === 'partnership' && target.listingId` into the main loop the
    same way the aircraft watch branch is wired (unavailable → one-time notice +
    pause; genuine drop → routes through the existing single-alert
    `buildPriceDropEmail` path, which already branches `dropNoun`/`shareType` on
    `target.type === 'partnership'` — no changes needed there).
- `src/lib/email.ts` — `buildListingUnavailableEmail` gets an optional `noun`
  param (default `'aircraft'`, so the existing aircraft call/tests are byte-for-
  byte unchanged) so the "sold or taken off the market" / "Browse similar
  aircraft" copy reads correctly for a partnership (`'closed'`/filled, not
  `'sold'`; "Browse similar partnerships").
- `src/lib/email.test.ts` — a few new cases for the `noun: 'partnership'` branch.

## Acceptance criteria
- `/partnerships/[id]` renders a second "Alert me if the buy-in drops" / "Watch
  buy-in" box below the existing family-search alert box, distinct copy, no
  price-drop/deal-only checkboxes (inherits `watchOnly`'s existing gate).
- Subscribing from that box writes an `alerts` row with
  `source_path=/partnerships/<id>?watch=price` and fires `alert_subscribed` with
  `source: 'partnership_watch'`.
- The existing aircraft watch box (`/aircraft/listing/[id]`) is visually and
  functionally unchanged (byte-for-byte copy).
- `buildListingUnavailableEmail()` with no `noun` renders identically to before
  (existing tests keep passing unmodified); with `noun: 'partnership'` it reads
  "filled or taken down" / "Browse similar partnerships".
- `npx tsc --noEmit` and `npx next build` both clean; full unit suite passes.
- QA smoke passes on `/partnerships/[id]` (a real listing) at desktop 1280 +
  mobile 375, zero console errors, zero horizontal overflow.

## Out of scope
- `/alerts/manage` watch-status display parity for this new shape (the aircraft
  equivalent shipped separately in `alerts-manage-watch-status`, scoped only to
  the aircraft shape) — left as a natural follow-up, not attempted this cycle.
- Bundling the "no longer available" notice into the combined multi-alert digest
  (already-noted omission, shared with the aircraft watch precedent).
- No real cron invocation against the shared prod Supabase (verify via unit
  tests + direct code read + a safe read-only DB check instead).
