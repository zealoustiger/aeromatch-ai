# partnership-hub-sticky-alert-bar

## Goal
Add the same mobile scroll-revealed "Get alerts for this search" sticky bottom bar
(`MobileStickyAlertBar`, already live on `/partnerships`, `/partnerships/seeking`, and all
7 aircraft SEO hub pages) to the three partnership hub pages that still only have the
static below-the-list `AlertSignup` box: `/partnerships/make/[make]`,
`/partnerships/near/[icao]`, `/partnerships/state/[state]`.

## Scope
- `src/app/partnerships/make/[make]/page.tsx`
- `src/app/partnerships/near/[icao]/page.tsx`
- `src/app/partnerships/state/[state]/page.tsx`

Each gets a `<MobileStickyAlertBar>` mounted at the end of the page (outside the main
content `<div>`, matching the `/aircraft/[make]` pattern), reusing the page's existing
alert context / source path already passed to its static `AlertSignup`, with a distinct
`source` per placement: `sticky_bar_partnership_make`, `sticky_bar_partnership_near`,
`sticky_bar_partnership_state`. Unlike the aircraft hub pages (which mostly have deep
inventory), these 3 partnership hubs can be thin — `/partnerships/near/[icao]` renders
as few as `MIN_NEARBY=2` cards, and many makes/states have well under 8 partnerships —
so the component's default "8th `<article>` scrolled past" reveal trigger would rarely
or never fire. Each page gets an `#alert-bar-reveal` sentinel placed right after its
header intro (mirroring `/aircraft/browse`'s fallback), and the bar is mounted with
`revealSelector="#alert-bar-reveal"` so it reveals reliably regardless of card count.

## Acceptance criteria
- All three pages render the sticky bar component; import + JSX added, no other page
  behavior changed.
- Each page passes a distinct `source` tag so conversion is measurable per placement
  (mirrors the naming convention `sticky_bar_<placement>` used by the 7 aircraft hubs).
- `npx next build` + `tsc --noEmit` pass clean.
- QA smoke (desktop 1280 + mobile 375) on all 3 routes plus `/partnerships` and
  `/partnerships/seeking` (regression check): HTTP 200, zero app-origin console errors,
  zero horizontal overflow.
- Visual QA: bar renders correctly pinned to the bottom on mobile, no overlap with other
  fixed elements (FeedbackWidget, ContactBar, etc. — not present on these hub pages).

## Out of scope
- No changes to `MobileStickyAlertBar` itself (shared component, unchanged — its
  existing `revealSelector` prop already supports the sentinel pattern).
- No changes to the static `AlertSignup` boxes already on these pages.
- No sentinel added to `/partnerships` or `/partnerships/seeking` (already shipped,
  out of this cycle's scope, and both reliably clear 8 cards in practice).
