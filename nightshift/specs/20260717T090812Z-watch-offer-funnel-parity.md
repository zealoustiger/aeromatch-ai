# watch-offer-funnel-parity

## Goal
Give `SavedListingWatchButton` (`/saved`, `source: 'saved_page_watch'`) and `SaveListingButton`'s
save→watch cross-sell banner (`source: 'save_cross_sell'`) the same `alert_capture_viewed` /
`alert_capture_opened` impression events every other watch-offer surface (`ContactBarWatchButton`,
`MobileStickyAlertBar`, `AlertMeChip`) already fires, so their per-placement conversion rate is
computable in the `/admin/alerts` funnel instead of only showing a subscribe count with no
denominator.

## Scope
- `src/components/SavedListingWatchButton.tsx` — fire `alert_capture_viewed` once when the
  button first renders in the `'offer'` state (mirror `ContactBarWatchButton`'s `viewedRef`
  one-shot pattern); fire `alert_capture_opened` at the start of `handleSubscribe`, before the
  `subscribeSignedInAlert` call.
- `src/components/SaveListingButton.tsx` — fire `alert_capture_viewed` once when the cross-sell
  banner (`crossSell === 'offer'`) first renders; fire `alert_capture_opened` at the start of
  `handleWatchSubscribe`, before the `subscribeSignedInAlert` call.
- Same payload shape as `ContactBarWatchButton`: `{ context, source_path, source }`.

## Out of scope
- No UI/visual change — same buttons, same copy, same layout.
- No new capture point, no schema change, no new server action.
- Not touching `ContactBarWatchButton`, `MobileStickyAlertBar`, or any other surface — those
  already fire the full event set.

## Acceptance criteria
- `SavedListingWatchButton` fires exactly one `alert_capture_viewed` per mount when it renders
  the offer button (not when it renders the "Watching" state), and one `alert_capture_opened`
  per click, before the subscribe action resolves.
- `SaveListingButton`'s cross-sell banner fires exactly one `alert_capture_viewed` per time it
  opens (`crossSell` transitions to `'offer'`), and one `alert_capture_opened` per "Yes, alert
  me" click, before the subscribe action resolves.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- `/saved` and any page rendering `SaveListingButton` (e.g. `/aircraft/listing/[id]`,
  `/partnerships/[id]`) still render and function identically — QA smoke passes at desktop
  1280 + mobile 375, no new console errors, no horizontal overflow.
- Existing `alert_subscribed` tracking calls on both components are unchanged.
