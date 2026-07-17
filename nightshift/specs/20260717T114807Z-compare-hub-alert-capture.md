# compare-hub-alert-capture

## Goal
Add an email-alert capture point to the `/aircraft/compare` index page, which today renders zero alert entry points while every child comparison page renders two.

## Scope
- `src/app/aircraft/compare/page.tsx` — add one `<AlertSignup>` below the comparison card grid, using the bare-`/` combined context pattern (`getAlertMatchCount('/')`, `noun="listing"`, `sourcePath="/"`, `source="compare_hub"`), matching the pattern already used on `/about` and `/` (homepage band).

## Acceptance criteria
- `/aircraft/compare` renders an `AlertSignup` box (email field, honest `matchCount`-derived copy, no fabricated numbers).
- The box's `source` prop is `"compare_hub"` so `alert_subscribed` events are attributable to this placement.
- No new route, no new SEO surface — this is an alert entry point on an existing indexed page only.
- `npx tsc --noEmit` and `npx next build` pass clean.
- `qa-smoke.mjs` passes on `/aircraft/compare` (and `/aircraft/compare/[comparison]` as a light regression check) at desktop 1280 + mobile 375: HTTP 200, 0 app-origin console errors, 0 horizontal overflow.
- Visual QA: screenshot shows the alert box rendering cleanly below the grid, consistent with the site's existing `AlertSignup` styling elsewhere.

## Out of scope
- Any change to child comparison pages (`/aircraft/compare/[comparison]`) — they already have two `AlertSignup`s.
- Any change to the digest/cron/email side.
- Any other backlog item (Duplicate-alert, price-drop-only mode, zero-match welcome email, multi-alert unsubscribe recovery).
