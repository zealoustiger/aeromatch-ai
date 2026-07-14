# home-recently-viewed-alert-banner

## Goal
Mount the existing `RecentlyViewedAlertBanner` on the homepage (`/`) above the generic
"Not ready to browse yet?" alert band, so a returning visitor sees a personalized
"you've been looking at X" alert prompt instead of the generic one — without ever
stacking both capture boxes on the same page.

## Scope
- `src/components/RecentlyViewedAlertBanner.tsx` — add an optional `fallback` prop:
  when the component has nothing honest to show (no recent-views match, dismissed, or
  match count came back 0), render `fallback` instead of `null`.
- `src/app/page.tsx` — replace the static "Not ready to browse yet?" section's inner
  content with `<RecentlyViewedAlertBanner fallback={...same content as before...} />`,
  keeping the same outer section/container wrapper so there is no layout change when
  the banner isn't showing (the common case in QA / for first-time visitors).

## Acceptance criteria
- On a fresh visitor (no `ch_recently_viewed` localStorage entries) the homepage renders
  byte-for-byte the same "Not ready to browse yet?" band as before (no regression).
- When a visitor has recent-views that resolve to a live match count > 0, the homepage
  shows the personalized banner instead of the generic band — never both.
- Dismissing the personalized banner falls back to the generic band (visitor is never
  left with zero alert capture on the page).
- No new PostHog event shape — reuses `alert_subscribed` with `source: 'recent_views'`
  (personalized) or `source: 'homepage_band'` (fallback), matching each path's existing
  `AlertSignup` call.
- `npx tsc --noEmit` and `npx next build` pass; no console errors; no horizontal overflow
  at 1280/375.

## Out of scope
- Any change to `deriveRecentlyViewedAlertContext`, `getAlertMatchCountForSourcePath`, or
  the dismiss/localStorage mechanism — reused as-is.
- Mounting this pattern anywhere besides `/`.
