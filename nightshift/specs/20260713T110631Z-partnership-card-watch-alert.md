# partnership-card-watch-alert

## Goal
Add the same one-tap "watch this share's buy-in price" bell affordance to `PartnershipCard` that `aircraft-card-watch-alert` (2026-07-13) shipped on `AircraftSaleCard`, so `/partnerships`, `/saved`, and every other surface rendering `PartnershipCard` has a per-listing alert entry point, not just the partnership detail page.

## Scope
- `src/components/PartnershipCard.tsx` — add `WatchAlertButton` (reused as-is, no changes needed) stacked below the existing heart in the photo overlay; toggling it mounts an inline `<AlertSignup watchOnly noun="partnership" source="partnership_card_watch" sourcePath={`/partnerships/${p.id}?watch=price`}>` panel, matching `AircraftSaleCard`'s wiring exactly.
- No changes to `WatchAlertButton.tsx`, `AlertSignup.tsx`, or any matching/cron/email code — the `/partnerships/<id>?watch=price` source_path shape is already resolved generically by `alertMatchCounts.ts`/`alertWatchStatus.ts`/`alertCrossSell.ts` (verified: shape-based regex match, not source-tag based), and `noun="partnership"` already renders the correct "buy-in" wording in `AlertSignup`.
- New capture point emits `alert_subscribed` with `source: 'partnership_card_watch'` (distinct from the detail page's `partnership_watch`) so this placement's conversion is measurable separately, mirroring `card_watch` vs `listing_watch` on the aircraft side.

## Acceptance criteria
- A bell icon appears stacked below the heart in the top-right photo overlay of every `PartnershipCard` (browse grid, `/saved`, rails, airport pages, etc.).
- Tapping the bell expands an inline watch-alert panel in place (no navigation); tapping again collapses it. Clicking the bell never triggers the card's own `Link` navigation.
- The panel is the existing `AlertSignup` component in `watchOnly` mode: signed-in visitors get the one-click confirmed-subscribe path, signed-out visitors get the compact email-only capture — identical behavior to the aircraft card / partnership detail page's watch box.
- Submitting the panel writes an `alerts` row with `source_path=/partnerships/<id>?watch=price` and `source=partnership_card_watch` (verified live against the real DB with a throwaway `@example.com` email, then deleted).
- `npx tsc --noEmit` and `npx next build` both pass; QA smoke (desktop 1280 + mobile 375) passes on `/partnerships` and `/saved` — HTTP 200, zero app-origin console errors, zero horizontal overflow.
- No layout shift/overlap on the existing card content (heart, badges, price, footer) at either viewport.

## Out of scope
- Any change to the aircraft card, the partnership detail page's existing watch box, or the alert-digest/cron matching logic (already generic).
- `SeekerCard` (the third listing type) — not in scope this cycle; a possible future follow-up.
