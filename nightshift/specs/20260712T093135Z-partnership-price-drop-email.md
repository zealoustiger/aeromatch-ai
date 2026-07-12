# Partnership single-listing buy-in-drop email

## Goal
Extend the rich single-listing `buildPriceDropEmail` template (aircraft-only today) to
partnership alerts whose only news this send is a genuine buy-in-price drop, so those
subscribers get the same best-in-aviation single-listing treatment aircraft subscribers
already get, instead of the aggregate digest's bare "+1 buy-in drop" count line.

## Scope
- `src/lib/email.ts` — `buildPriceDropEmail`: add optional `dropNoun` (default `"price drop"`)
  and `shareType` params so the subject/badge copy can say "buy-in drop" and the card can show
  the share fraction, reusing the existing `dropNoun`/`shareType` conventions already used by
  `buildAlertDigestEmail` / `AlertDigestSample`.
- `src/app/api/cron/alert-digest/route.ts` — widen the `bestDrop` condition from
  `target.type === 'aircraft'` to also cover `target.type === 'partnership'`, and pass
  `dropNoun: 'buy-in drop'` + `shareType: bestDrop.shareType` into `buildPriceDropEmail` on the
  partnership branch. Reuses `pickBestPriceDropSample` and the existing
  `fetchPartnershipPriceDropSamples` as-is — no new query.
- `src/app/api/dev/email-preview/price-drop/route.ts` — add a `?type=partnership` fixture so
  the new copy can be eyeballed without touching the DB or sending real email.

## Acceptance criteria
- `buildPriceDropEmail` accepts `dropNoun`/`shareType` and defaults to today's exact aircraft
  copy when they're omitted (no regression for the aircraft path).
- A partnership alert whose only news is a buy-in drop (`newCount === 0 && dropCount > 0`) now
  gets the single-listing template with "X% buy-in drop" copy and the share fraction (e.g.
  "1/4 Share") shown, instead of falling through to the aggregate digest.
- Aircraft price-drop-only sends are byte-for-byte unchanged (same subject/copy as before).
- `npx tsc --noEmit` and `npx next build` both exit 0.
- No schema change, no new capture point, no live cron invocation against real subscribers.

## Out of scope
- Any change to `fetchPartnershipPriceDropSamples`/`countRecentPartnershipPriceDrops` (already
  correct, mirrors the aircraft path).
- The still-pending `previous_buy_in_price`/`buy_in_price_changed_at` migration status — this
  cycle only wires the email template; the graceful-degrade fallback for that column pair
  already exists and is untouched.
- Seeker alerts (no price at all — out of scope for price-drop emails entirely).
