# Live-match expectation line at alert capture

## Goal
Show a real, live "N listings match right now" (or honest zero-state) line on `AlertSignup`
so a visitor knows what the alert will actually do before they hand over their email —
closing the `[P1][goal]` gap flagged in BACKLOG.md's 🔔 alert-experience queue.

## Scope
- `src/components/AlertSignup.tsx` — new optional `matchCount?: number` prop; renders
  "{N} listings match right now — we'll email you when the next one lists" (or, at a
  genuine 0, "None for sale right now — be first to know when one lists") above the
  existing subscriber social-proof line. Never fabricated — renders nothing when the prop
  is omitted (unrecognized `source_path` shape). Also add `match_count` to the
  `alert_subscribed` analytics payload in both the anonymous and signed-in submit paths.
- `src/app/aircraft/[make]/[model]/page.tsx` — pass the page's own already-computed `n`
  (live `countMakeModel` result, used today for the thin-page 404 guard) straight through
  as `matchCount` — zero new queries.
- `src/app/aircraft/listing/[id]/page.tsx` — fetch `getAlertMatchCount(alertSourcePath)`
  (existing helper, powers `/alerts/manage`'s live-match line) alongside the existing
  subscriber-count fetch; thread the resulting count through to the page's own
  `AlertSignup` plus `AircraftContactButton` and `PhoneContactLink` (both already receive
  `alertCount` and render their own post-contact `AlertSignup`, so they need the new prop
  too for consistency).
- `src/components/AircraftContactButton.tsx`, `src/components/PhoneContactLink.tsx` —
  thread a new `matchCount?: number` prop through to their inner `AlertSignup`.

## Acceptance criteria
- On `/aircraft/[make]/[model]` pages, the alert box shows the real live match count
  (matches the page's own listing count / H1 number).
- On `/aircraft/listing/[id]` pages, the alert box (and the post-contact cross-sell
  instances) show a live match count derived from the same make/model search the alert
  subscribes to.
- A genuine 0-match case renders the honest "be first to know" copy, never a fake number.
- Pages/components whose `source_path` shape isn't recognized by `getAlertMatchCount`
  render no line at all (no prop passed / `undefined` → no crash, no fabricated 0).
- `alert_subscribed` events fired from these surfaces carry `match_count`.
- `npx next build` + typecheck pass; QA smoke clean (200 / no console errors / no 375px
  overflow) on both page families; no other page's `AlertSignup` rendering changes
  (prop is optional and additive).

## Out of scope
- The "Only good deals" smart-alert filter (separate backlog item, next in the queue).
- Wiring `matchCount` into every other `AlertSignup` call site (guides, `/saved`,
  homepage, partnership/seeker pages) — this slice is listing-detail + make/model only,
  per the backlog item's own "wire it here first."
- Any change to `alertMatchCounts.ts`'s parsing logic itself.
