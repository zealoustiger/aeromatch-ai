# Spec: "Alert me about similar" one-tap conversion on the watched-listing unavailable email

## Goal
When a watched listing sells/is removed, the one-time "no longer available" email offers
a one-tap "Yes, alert me too →" button that converts the dead watch into a genuine,
honesty-gated family alert on the same already-verified address — instead of only a
passive "Browse similar" link.

## Scope
- `src/lib/email.ts` — `buildListingUnavailableEmail` gains an optional
  `crossSell?: { label: string; acceptUrl: string }` opt, rendered with the same HTML/text
  block `buildAlertDigestEmail`'s existing `crossSell` option uses (reuse, not reinvent).
- `src/app/api/cron/alert-digest/route.ts` — the `unavailableWatches` send loop computes
  the suggestion via the existing `getDigestCrossSell` helper (already used by the regular
  digest send path; internally resolves watch alerts via `getWatchCrossSell`, honesty-gated
  on a real live match count, de-duped against alerts the subscriber already has) and wires
  it into `buildListingUnavailableEmail`.
- `src/app/api/alerts/digest-cross-sell/route.ts` — generalized to accept an optional
  allowlisted `source` query param (`digest_cross_sell` default, or
  `watch_unavailable_email`) so the new placement gets its own analytics tag instead of
  being indistinguishable from the existing digest cross-sell.
- `src/app/alerts/status/page.tsx` — threads the `source` param through to
  `AlertStatusTracker`'s `alert_subscribed` event (was hardcoded `'digest_cross_sell'`).
- `src/lib/email.test.ts` — new unit tests for the `crossSell` option.

## Acceptance criteria
- The "listing unavailable" email, when a genuine family suggestion exists (real live
  match count > 0, not already subscribed), renders a "Yes, alert me too →" button in
  addition to the existing "Browse similar" link, in both HTML and plain text.
- When no honest suggestion applies (no matches, or already subscribed to that family),
  the email renders exactly as before — no new element, byte-identical (existing golden
  master test covers the no-`crossSell`-passed case).
- Clicking the button subscribes the same (already-verified) email to the family alert
  with `status: 'confirmed'` (no second opt-in) and lands on `/alerts/status?state=
  cross_sell_added` with the correct context copy.
- The resulting `alert_subscribed` PostHog event fires with `source: 'watch_unavailable_email'`
  (distinct from the existing digest cross-sell's `source: 'digest_cross_sell'`), satisfying
  GOAL.md's "prove it converts" per-placement measurement.
- Re-clicking the same link (or if the family alert already exists) is idempotent — no
  duplicate row, no error page.
- `next build` + `tsc --noEmit` pass; full unit suite passes with no regressions.

## Out of scope
- The dormant-subscriber re-permission email (next item in plan-pass batch #9).
- Bounced-heads-up parity on the confirm-resend path (next item in plan-pass batch #9).
- Changing the existing digest email's own cross-sell UX/copy.
