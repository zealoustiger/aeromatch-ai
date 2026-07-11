# partnership-digest-samples

## Goal
Give partnership alerts the same real preview-card treatment in the weekly digest email that aircraft alerts already have, instead of the CTA-only fallback.

## Scope
- `src/lib/email.ts`: extend `AlertDigestSample` with an optional `shareType` field; `specsLine`/text-body specs line show `shareType` in place of `ttaf` when present (partnerships have no TTAF). Update the `buildAlertDigestEmail` doc comment (samples are no longer aircraft-only).
- `src/app/api/cron/alert-digest/route.ts`: add `fetchNewPartnershipSamples` (mirrors `fetchNewAircraftSamples`'s filter/limit/order pattern against the `partnerships` table: make/state/icao filters, `status='active'`, ordered by `created_at desc`, limit 3) and a `toPartnershipDigestSample` row mapper (title = year+make+model, photo via existing `pickRealPhoto`/`getPlaceholderPhoto`, price = `buy_in_price`, shareType = `formatShareType(share_type)`, location = `city, state` falling back to `home_airport`, url = `/partnerships/{id}`). Wire it into the cron handler's existing `samples` computation for `target.type === 'partnership'` when `newCount > 0`.

## Acceptance criteria
- A partnership alert with genuine new matching listings since its last digest now renders up to 3 real preview cards (photo/placeholder + honest caption, title, share type, location, buy-in price) in the digest email, instead of the CTA-only fallback.
- Aircraft-alert digest rendering is unchanged (same samples, same layout).
- Seeker alerts and partnership alerts with zero new listings are unchanged (no samples, CTA-only).
- `npx tsc --noEmit` and `npx next build` pass.
- No schema change; no new capture point; no live cron send (RESEND_API_KEY guard unchanged).

## Out of scope
- Partnership price-drop preview-card samples (parity item, separate slice — not asked for by this backlog item).
- Any change to seeker-alert digest content.
- The two other queued `[P2][goal]` items (saved-search inline alert settings; nearby-state cross-sell) — separate cycles.
