# Watch this listing — price-drop alert for one specific aircraft

## Goal
Let a buyer eyeing one specific aircraft-for-sale listing subscribe to "alert me if this
listing's price drops," instead of only being able to alert on a whole make/model search.

## Scope
- `src/components/AlertSignup.tsx` — new `watchOnly` prop: distinct copy ("Alert me if the
  price drops"), hides the price-drop/deal-only checkboxes (not meaningful for a single
  already-known listing — the whole point of a watch alert is implicit price-drop matching).
- `src/app/aircraft/listing/[id]/page.tsx` — render a second, compact `AlertSignup` on the
  active-listing sidebar (`watchOnly`, `sourcePath=/aircraft/listing/<id>?watch=price`,
  `context` = the listing's own title), below the existing family-scoped alert box.
- `src/app/api/cron/alert-digest/route.ts` — `AlertTarget`'s aircraft variant gains an
  optional `listingId`; `resolveTarget` learns the `/aircraft/listing/[id]?watch=price` shape
  (checked before the make/model regex, which would otherwise misparse "listing" as a make
  slug). New `resolveListingWatch()` looks the row up directly by id and returns either a
  genuine price drop (reuses the existing single-listing `buildPriceDropEmail` path
  unchanged) or "unavailable" (row missing or `status !== 'active'`).
- `src/lib/email.ts` — new `buildListingUnavailableEmail()`.
- Honesty gate (GOAL.md): when the watched listing is sold/removed, send exactly ONE
  "no longer available" email (not silence forever) and pause the alert right after so it's
  genuinely one-time, not repeating every cron pass.
- New capture point → `alert_subscribed` fires with `source: 'listing_watch'`.

## Acceptance criteria
- `/aircraft/listing/[id]` (active listing) renders a second "Alert me if the price drops"
  box below the existing family alert box; submitting (anon or signed-in) creates an `alerts`
  row with `source_path = /aircraft/listing/<id>?watch=price` and fires `alert_subscribed`
  with `source: 'listing_watch'`.
- The cron's `resolveTarget` correctly parses that source_path shape into
  `{ type: 'aircraft', listingId }` and does NOT misparse it as make="listing".
- A genuine price drop on the watched row (verified via a temporary `tsx` harness against
  real prod data, read-only) routes to the same `buildPriceDropEmail` template already used
  for family-scoped single-listing drops.
- A watched listing that's sold/removed (`status !== 'active'` or row missing) produces one
  `buildListingUnavailableEmail` send and the alert's `status` flips to `paused` immediately
  after — verified it does NOT fire again on a second simulated pass.
- `next build` + typecheck clean; new unit tests for `buildListingUnavailableEmail` pass.
- QA smoke clean on `/aircraft/listing/[id]` (desktop 1280 + mobile 375, no console errors,
  no overflow); screenshots read (visual cycle — new UI).

## Out of scope
- Bundling the "unavailable" notice into the combined multi-alert digest email (rare overlap
  case — always sends its own dedicated email even if the subscriber has another alert due
  in the same pass; matches the precedent `alert-digest-combine` set for the frequency-toggle
  omission in combined sends).
- `/alerts/manage` UI enrichment specific to watch-alerts (Edit form, live match count,
  "send sample") — the existing generic parsers there already fail closed/gracefully for this
  new source_path shape (no Edit button, no match-count line), consistent with how every
  other unrecognized shape (mission pages, etc.) already degrades.
- A "watch" toggle on an *existing* family-scoped alert — this is a brand new capture point,
  not an edit to existing alerts.
