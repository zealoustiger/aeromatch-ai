# alert-digest-cross-sell

## Goal
Add the one remaining `[P2][goal]` alert-experience item: a one-click "also want
alerts for X?" cross-sell suggestion inside the weekly/daily digest email itself,
so the growth loop already live on `/alerts/status` and `/alerts/manage` also
reaches subscribers who never click back into the site.

## Scope
- `src/lib/email.ts` — add an optional top-level `crossSell?: { label: string;
  acceptUrl: string }` option to `buildAlertDigestEmail` and
  `buildCombinedAlertDigestEmail` (one suggestion total per email, not
  per-section). Renders a small sky-tinted box with the label + a plain link
  button, above the footer.
- `src/app/api/alerts/digest-cross-sell/route.ts` (new) — GET-only accept route
  mirroring `/api/alerts/frequency`'s token-in-link precedent: resolves the
  owner email from the sending alert's `unsubscribe_token`, inserts a new
  confirmed `alerts` row for the suggested `context`/`source_path` (23505 =
  already-subscribed = idempotent success), redirects to
  `/alerts/status?state=cross_sell_added&context=...`.
- `src/app/api/cron/alert-digest/route.ts` — wire `getCrossSellSuggestion`
  (existing `alertCrossSell.ts`) into both the single-alert and combined send
  paths (not the price-drop rich-template path). New local
  `getDigestCrossSell` helper re-queries the subscriber's confirmed alerts by
  email to dedup against a suggestion they already have (same "not already
  subscribed" honesty gate `/alerts/manage`'s cross-sell already applies).
- `src/app/alerts/status/page.tsx` — add a `cross_sell_added` state so the
  accept link's redirect target renders a real confirmation instead of
  falling through to `invalid`.
- `src/components/AlertStatusTracker.tsx` — extend the tracked-event union to
  include `alert_subscribed` with a `source`/`context` payload so the accepted
  suggestion emits the funnel event on landing.

## Acceptance criteria
- `email.ts`'s two digest builders render the cross-sell box only when a
  `crossSell` opt is passed; omitted entirely otherwise (existing digest
  emails with no suggestion render byte-identical to before).
- The new accept route: valid token + honest suggestion → new confirmed
  `alerts` row (or idempotent no-op if already subscribed) → redirect to a
  real confirmation page; invalid/tampered token → redirects to the existing
  `invalid` state, no row written.
- The cron only ever attaches a suggestion the subscriber isn't already
  subscribed to (re-verified against their live confirmed alerts, not just
  the current send batch).
- Accepting emits `alert_subscribed` with `source: 'digest_cross_sell'`.
- `npx tsc --noEmit` and `npx next build` stay clean.
- No schema change, no new dependency, no FREEZE file touched.

## Out of scope
- Attaching a suggestion to the price-drop rich single-listing template
  (`buildPriceDropEmail`) — backlog names only the two digest builders.
- Per-section suggestions in the combined email (explicitly "one total, not
  per-section" per BACKLOG.md).
- Any change to `/alerts/manage`'s existing cross-sell implementation.
