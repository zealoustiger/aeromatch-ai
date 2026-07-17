# Mobile sticky watch bar on the aircraft listing detail page

## Goal
Give mobile visitors on `/aircraft/listing/[id]` — the highest-intent page on the
site — a persistent, scroll-triggered "watch this listing for price drops" bar,
mirroring the sticky alert bar already live on the `/aircraft`/`/partnerships`
browse pages, instead of leaving the watch offer buried in the sidebar/below-the-fold
`AlertSignup watchOnly` panel.

## Scope
- Generalize `src/components/MobileStickyAlertBar.tsx` to accept optional
  `revealSelector` (reveal-trigger element, defaulting to the existing 8th-card
  behavior), `source`, and copy-override props (`idleLabel`, `emailLabel`,
  `confirmedLabel`) — no behavior change for its two existing browse-page callers
  (`/aircraft`, `/partnerships`), which pass none of the new props.
- `src/app/aircraft/listing/[id]/page.tsx`: add a sentinel element right after
  `PhotoGallery` (`#watch-bar-reveal`) and render `MobileStickyAlertBar` scoped to
  the listing's own `watchSourcePath` (`?watch=price`, already computed on this
  page for the existing `AlertSignup watchOnly` panel), tagged `source:
  "sticky_bar_detail"` so its conversion is measurable separately from the browse
  bars and the in-page watch panel.

## Out of scope
- `/partnerships/[id]` — that page already renders `ContactBar`, a persistent
  `fixed inset-x-0 bottom-0` mobile bar (contact/message the poster) with no
  scroll gate and multiple taller states (compose form, sent confirmation).
  Stacking a second full-width fixed bottom bar risks exactly the "must not
  overlap the page's existing bottom-of-page content" failure this backlog item
  warns about, and reliably avoiding overlap across ContactBar's stateful height
  would need its own scoped design (e.g. folding the watch offer into ContactBar's
  own button row) — left as a follow-up, not attempted this cycle.
- No changes to the existing card-level `WatchAlertButton` bell / `AlertSignup
  watchOnly` panel already on the page — this adds a second, scroll-triggered
  entry point, it doesn't replace the first.
- No new PostHog event names — reuses `alert_capture_viewed` / `alert_capture_opened`
  / `alert_subscribed`, just a new `source` value.

## Acceptance criteria
- On `/aircraft/listing/[id]` at 375px, the bar is absent until the visitor
  scrolls past the photo gallery, then appears fixed to the bottom.
- Tapping it (signed-in, no existing watch) creates a real alert on the listing's
  `?watch=price` sourcePath via `subscribeSignedInAlert`, fires `alert_subscribed`
  with `source: "sticky_bar_detail"`, and flips to a confirmed state.
- If the visitor already watches this exact listing (`getExistingAlertForSourcePath`
  hit) the bar never shows (mirrors the browse-page bars' `alreadySubscribed` gate).
- Dismissing it persists per-listing (existing `localStorage` dismiss key, already
  scoped by `sourcePath`) and it stays hidden on that listing thereafter.
- `/aircraft` and `/partnerships` browse pages render their sticky bar exactly as
  before (no prop changes there) — regression check.
- `npx tsc --noEmit` and `npx next build` both exit 0.
