# Mobile sticky "Get alerts for this search" bar on /aircraft + /partnerships

## Goal
Give mobile visitors (most of our traffic) a persistent, low-friction "get alerts for
this search" affordance on the two flagship browse pages, instead of relying only on
per-card bells and a footer form several screens down.

## Scope
- New client component `src/components/MobileStickyAlertBar.tsx` — mirrors
  `AlertMeChip.tsx`'s signed-in/signed-out subscribe logic 1:1 (same server actions,
  same existing-alert/local-subscription checks, same impression/open/subscribe
  tracking), but renders as a `fixed bottom-0` bar, mobile-only (`md:hidden`).
- Wire it into `src/app/aircraft/page.tsx` and `src/app/partnerships/page.tsx`
  (mounted inside `<CompareProvider>`, alongside `<CompareTray />`), passing the
  same `alertContext`/`alertSourcePath` already threaded to the footer `AlertSignup`.
- Gating: only appears after the visitor scrolls past the 8th result card
  (IntersectionObserver on a sentinel card, re-queried via MutationObserver in case
  the list streams in after this component mounts); dismissible with per-`sourcePath`
  localStorage persistence (mirrors `alertLocalSubscriptions.ts`'s SSR-safe pattern);
  never shows to a visitor who already has an alert for this exact search
  (`hasExistingAlert`/`isLocallySubscribed`, same as `AlertMeChip`); hides whenever
  the on-screen keyboard is open (`visualViewport` height-shrink heuristic); hides
  whenever `CompareTray` is showing (`useCompareOptional().count > 0`) to avoid two
  bars stacking at the bottom edge.
- Analytics: fires `alert_capture_viewed` once when it first becomes visible,
  `alert_capture_opened` on tap, `alert_subscribed` on a successful signed-in
  subscribe — all with `source: 'sticky_bar'`, matching `AlertMeChip`'s payload shape.
- Signed-in tap = one-click subscribe via `subscribeSignedInAlert(..., 'sticky_bar')`.
  Signed-out tap = smooth-scroll + focus the existing footer `AlertSignup`'s
  `#alert-email` field (no new subscribe path).

## Acceptance criteria
- On `/aircraft` and `/partnerships` at a 375px viewport, the bar is invisible on
  initial load and appears only after scrolling past ~8 result cards.
- The bar never renders at desktop width (1280px) — mobile-only.
- Dismissing the bar (X button) hides it and it stays hidden on a fresh page load of
  the same search (localStorage-persisted), but a different filter/search still shows it.
- A signed-in visitor with an existing alert for the exact active search never sees
  the bar. A signed-out visitor who already locally-subscribed at this `sourcePath`
  never sees it either.
- Tapping the bar while signed out scrolls to and focuses the footer alert email
  field; while signed in, it subscribes directly and swaps to a confirmation state
  (no page navigation, no duplicate DB row).
- `npx tsc --noEmit` and `npx next build` both exit 0; QA smoke passes at desktop
  1280 + mobile 375 with zero console errors and zero horizontal overflow.

## Out of scope
- No changes to `AlertMeChip`, `AlertSignup`, `CompareTray`, or any existing capture
  surface.
- No schema change.
- Not adding this bar to any other page (seeking, listing detail, etc.) — scoped to
  the two flagship browse pages named in the backlog item.
- No auto-hide timer on the confirmation state (user dismisses manually, same as
  `AlertMeChip`'s persistent "Alerts on" pill).
