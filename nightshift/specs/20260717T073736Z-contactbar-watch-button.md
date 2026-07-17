# contactbar-watch-button

## Goal
Add a one-tap "Watch" (price-drop alert) button to the `/partnerships/[id]` mobile sticky `ContactBar`'s default button row, closing the remaining slice of the `[P1][goal]` "mobile sticky watch bar on listing detail pages" backlog item (aircraft detail already shipped via `mobile-sticky-watch-bar-detail`; partnerships was deliberately deferred to avoid stacking a second bottom bar on top of `ContactBar`).

## Scope
- New `src/components/ContactBarWatchButton.tsx` — self-contained client component (own auth/local-subscription checks, mirrors `SavedListingWatchButton`/`MobileStickyAlertBar`'s existing machinery: `getExistingAlertForSourcePath`, `subscribeSignedInAlert`, `subscribeToAlerts`, `isLocallySubscribed`/`addLocalSubscription`/`getLocalEmail`). States: loading (render nothing) → offer ("Watch" button) → watching ("Watching" pill) / one-tap-pending ("Check email" pill). Anonymous visitor with no remembered email taps → scrolls to + focuses the page's existing "Watch this partnership" `AlertSignup` box (no room for a full email field in the button row).
- `src/components/ContactBar.tsx` — add optional `watchContext`/`watchSourcePath`/`watchFallbackSelector` props; render `ContactBarWatchButton` as a 4th `flex-1` sibling in the existing default-state button row (L223-265), only in that state (never in expanded/sent/poster-note states).
- `src/app/partnerships/[id]/page.tsx` — hoist the already-computed `watchContext`/`watchSourcePath` values (currently inlined separately at the `SaveListingButton` call and the "Watch this partnership" `AlertSignup` call) into local consts, reuse in both existing call sites plus the new `ContactBar` props; wrap the "Watch this partnership" `AlertSignup` box in a `<div id="partnership-watch-box">` so the fallback scroll target is unambiguous (the page has 2 `AlertSignup` boxes that can both render `id="alert-email"` when anonymous with no remembered email — this makes the scroll land on the right one without touching `AlertSignup` itself).

## Acceptance criteria
- `/partnerships/[id]` mobile (375px) `ContactBar` default state renders a 4th "Watch" button (Bell icon) alongside Message/Email/Call, only when none of the other bar states (expanded message form, just-sent confirmation, poster's-own-listing note) are active.
- Tapping "Watch" as a signed-in visitor writes a real `alerts` row (`subscribeSignedInAlert`, `source: 'sticky_bar_detail'`) and swaps the button to a "Watching" pill in place, no reload.
- Tapping "Watch" as an anonymous visitor with a remembered alert email one-taps via `subscribeToAlerts` and shows "Check email"; with no remembered email it scrolls to and focuses the page's own watch alert box instead of silently failing.
- A visitor who already has an alert on this listing's `?watch=price` sourcePath sees "Watching" immediately (no redundant offer).
- `alert_subscribed` fires with `source: 'sticky_bar_detail'` on every successful subscribe path (signed-in + one-tap).
- No horizontal overflow or layout shift at 375px with 4 buttons present (worst case: Message + Email + Call + Watch all shown); `npx tsc --noEmit` and `next build` pass.

## Out of scope
- Any change to the aircraft detail page's existing `MobileStickyAlertBar` (already shipped, untouched).
- Adding a full inline email-capture form inside `ContactBar` itself for anonymous visitors with no remembered email (defers to the existing sidebar box instead).
- Fixing the pre-existing duplicate `id="alert-email"` issue in `AlertSignup` generally (only worked around locally via the new wrapper id for this fallback's scroll target).
