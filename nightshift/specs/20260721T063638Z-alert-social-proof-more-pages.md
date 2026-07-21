# Spec: alert-social-proof-more-pages

## Goal
Wire the existing honesty-gated "N buyers get alerts for this" social-proof line
(`AlertSignup`'s `alertCount` prop, backed by `getAlertCounts()`) into 4 more
`AlertSignup` call sites that have a clean single `context` string but were left
un-wired — continuing the multi-cycle BACKLOG item started by
`alert-social-proof-hub-pages` (2026-07-21).

## Scope
- `src/app/airports/[icao]/page.tsx` — `AlertSignup context={airport.icao}`
- `src/app/partnerships/seeking/page.tsx` — `AlertSignup context={alertContext}` (context can be `undefined` when no make/model filter active — guard `getAlertCounts` call and the `.get()` lookup)
- `src/app/aircraft/mission/[mission]/page.tsx` — `AlertSignup context={`${m.label} aircraft for sale`}`
- `src/app/aircraft/deals/page.tsx` — `AlertSignup context="good deal"`

For each: import `getAlertCounts` from `@/lib/alertCounts`, fetch counts server-side
for the page's exact context string(s), pass `alertCount={counts.get(context)}` to
the existing `AlertSignup` call. No new component, no schema change, no new capture
point — pure wire-up of an already-shipped, already-tested feature (same pattern as
the last 3 cycles that did this for 7 other pages).

## Out of scope
- Pages with multiple/complex `AlertSignup` contexts per page (`/partnerships/[id]`,
  `/partnerships/seeking/[id]`, `/aircraft/compare/[comparison]`) — next slice.
- Pages with no `context` prop at all (homepage band, `/aircraft/browse`,
  `/listing-quality`) — social proof needs a context key, not applicable as-is.
- Any change to `AlertSignup.tsx`, `MobileStickyAlertBar.tsx`, or `alertCounts.ts` —
  the mechanism already exists and is correct.

## Acceptance criteria
- `npx tsc --noEmit` and `npx next build` both pass clean.
- All 4 pages still render correctly with zero new console errors, zero horizontal
  overflow at 1280px + 375px (qa-smoke gate).
- Each page's `AlertSignup` receives a real `alertCount` computed via
  `getAlertCounts()` against the real `alerts` table (service-role read, honesty
  floor `MIN_ALERTS_TO_SHOW=3` already enforced inside `AlertSignup` itself — no
  duplicate floor logic needed here).
- `partnerships/seeking` page doesn't crash/error when `alertContext` is `undefined`
  (no active make/model filter).
- No fabricated counts — if 0 confirmed alerts exist for a context, the line simply
  doesn't render (existing behavior, unchanged).
