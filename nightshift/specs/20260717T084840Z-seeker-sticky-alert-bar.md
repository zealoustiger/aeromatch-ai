# Mobile sticky alert bar on /partnerships/seeking

## Goal
Give owners browsing `/partnerships/seeking` on mobile a persistent, scroll-revealed
"get alerted" capture — the same pattern `/aircraft` and `/partnerships` already have —
so demand-side capture isn't only available by scrolling all the way to the footer
`AlertSignup`.

## Scope
- `src/app/partnerships/seeking/page.tsx`: import + render `MobileStickyAlertBar` with
  the page's existing `alertContext`/`alertSourcePath` (already computed for the filter
  chip and footer `AlertSignup`), demand-side copy, and a distinct `source` so its
  conversions are attributable separately from the other two bars.
- No changes to `MobileStickyAlertBar.tsx` itself — its card-based scroll-depth reveal
  targets the 8th `<article>` on the page. **Discovered during scoping:** `SeekerCard`'s
  outer wrapper is a `<div>`, not `<article>` like `AircraftSaleCard`/`PartnershipCard` —
  without fixing that, the bar would never find its reveal target and would silently
  never appear. Change `SeekerCard`'s outer wrapper `<div className="relative">` to
  `<article className="relative">` (purely semantic tag swap, no class/behavior change;
  the `SaveListingButton` absolute-positioned sibling is unaffected).
- No schema change, no new server action — reuses `subscribeToAlerts`/
  `subscribeSignedInAlert` exactly as the existing two bars do.

## Acceptance criteria
- On `/partnerships/seeking` at mobile width (<768px), scrolling past ~8 seeker cards
  reveals a bottom sticky bar with honest demand-side copy (e.g. "Get an email when a
  pilot starts looking").
- Bar is invisible above that scroll depth, on desktop (`md:hidden`), and once the
  visitor is already subscribed for this exact `sourcePath` (existing `alreadySubscribed`
  logic, unchanged).
- Tapping it fires `alert_capture_viewed`/`alert_capture_opened`/`alert_subscribed` with
  `source: 'sticky_bar_seeking'` (distinct from `/aircraft`'s and `/partnerships'`
  default `sticky_bar`).
- No horizontal overflow or new console errors on `/partnerships/seeking` at 375px or
  1280px, filtered or unfiltered.
- `/aircraft` and `/partnerships`' existing sticky bars are unchanged (they still omit
  `source`, defaulting to `'sticky_bar'`).

## Out of scope
- Any change to the desktop layout or the existing footer `AlertSignup`/filter-toolbar
  chip on this page.
- Changing `MobileStickyAlertBar`'s reveal/dismiss/subscribe logic.
