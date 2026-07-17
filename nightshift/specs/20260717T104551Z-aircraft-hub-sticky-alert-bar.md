# Mobile sticky alert bar on the aircraft SEO hub pages

## Goal
Mount the existing `MobileStickyAlertBar` (currently only on `/aircraft`, `/partnerships`,
`/partnerships/seeking`, `/aircraft/listing/[id]`) on the 7 aircraft SEO hub pages that today
only offer the static below-list `AlertSignup`, so a mobile visitor who scrolls past the fold
on any of them gets a persistent one-tap alert offer.

## Scope
- `src/app/aircraft/[make]/page.tsx` — add `MobileStickyAlertBar` (no `CompareProvider` here;
  wrap the existing single top-level `<div>` return in a fragment).
- `src/app/aircraft/[make]/[model]/page.tsx` — already has `CompareProvider`/`CompareTray`;
  add the bar right after `<CompareTray />`, mirroring `/aircraft/page.tsx`'s exact pattern.
- `src/app/aircraft/[make]/[model]/[state]/page.tsx` — same as above (already has
  `CompareProvider`/`CompareTray`).
- `src/app/aircraft/for-sale/[state]/page.tsx` — no `CompareProvider`; wrap in a fragment.
- `src/app/aircraft/mission/[mission]/page.tsx` — already has `CompareProvider`/`CompareTray`;
  add after `<CompareTray />`.
- `src/app/aircraft/deals/page.tsx` — no `CompareProvider`; wrap in a fragment.
- `src/app/aircraft/browse/page.tsx` — no `CompareProvider`, and (unlike the other 6) renders
  zero `<article>` elements (pure link-hub), so the default 8th-card reveal trigger would never
  fire. Add a `revealSelector` sentinel `<div>` (mirroring `/aircraft/listing/[id]`'s
  `#watch-bar-reveal` pattern) right after the page's intro `<header>`.

Each mount reuses the page's own already-computed `AlertSignup` context/sourcePath (or the
mission page's `alertSourcePath`), passed straight to `MobileStickyAlertBar`, with a distinct
`source` per page for per-placement analytics: `sticky_bar_make`, `sticky_bar_make_model`,
`sticky_bar_make_model_state`, `sticky_bar_state`, `sticky_bar_mission`, `sticky_bar_deals`,
`sticky_bar_browse` (none collide with existing `sticky_bar`/`sticky_bar_seeking`/
`sticky_bar_detail`, or any existing `AlertSignup` source values on the same pages).

No copy overrides beyond the component's defaults (idle/email/confirmed labels) — every one of
these 7 pages is buyer-side "for sale" browsing, same intent as `/aircraft`'s own bar.

## Acceptance criteria
- All 7 pages render `MobileStickyAlertBar` with the correct `context`/`sourcePath`/`source`
  props, verified by direct code read.
- `/aircraft/browse` reveals via its new sentinel div, not the (absent) 8th-article trigger.
- The other 6 pages rely on the component's default card-based reveal (no `revealSelector`) —
  acceptable degrade if a thin family has <8 cards (bar simply never reveals there, same
  precedent as any other card-count-gated page).
- No change to `AlertSignup`, `CompareProvider`, `CompareTray`, or any existing component's
  behavior — purely additive JSX + one new import per file.
- `tsc --noEmit` and `next build` both pass.
- `qa-smoke.mjs` passes (HTTP 200, 0 app-origin console errors, 0 horizontal overflow) at
  desktop 1280 + mobile 375 on a representative sample of the 7 routes plus `/aircraft` (regression
  check for the untouched sibling pattern).
- Live-verified (Playwright, scrolled) on at least 2 of the 7 pages that the bar actually
  reveals on mobile and the tap opens the expected email-focus / one-tap-subscribe flow — no
  new prod rows left behind.

## Out of scope
- Any change to the partnership-side hub pages (`/partnerships/make/[make]`,
  `/partnerships/near/[icao]`, `/partnerships/state/[state]`) — that's the next planner-batch
  item, a separate slice.
- Any change to `AlertSignup` itself, digest/email logic, or `/alerts/manage`.
- New copy/label customization beyond the `source` tag.
