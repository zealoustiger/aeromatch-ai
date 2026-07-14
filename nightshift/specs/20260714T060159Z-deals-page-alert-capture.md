# deals-page-alert-capture

## Goal
Add an email-only "alert me for new good deals" capture to `/aircraft/deals` — the
highest-intent browse page on the site that currently has no alert entry point.

## Scope
- `src/app/aircraft/deals/page.tsx` — render `<AlertSignup>` after the listings/
  aggregation disclosure, `context="good deal"`, `sourcePath="/aircraft?deal=good"`,
  `source="deals_page"`, `matchCount={deals.length}` (the exact honest count already
  computed for the cards above it).
- `src/components/AlertSignup.tsx` — hide the redundant "Only email me good deals"
  checkbox when the caller's `sourcePath` already carries `deal=good` (this page IS
  deals-only already; showing the checkbox would read as confusing/redundant).

## Acceptance criteria
- `/aircraft/deals` renders an `AlertSignup` box below the listings (both when there
  are deals and when the list is empty — the 0-match honest copy already handles that).
- The resulting alert's `source_path` is `/aircraft?deal=good` (parseable by the
  existing digest cron / match-count / edit-criteria helpers with zero changes there —
  `deal=good` is already a first-class recognized param).
- The "Only email me good deals" checkbox does NOT render on this page (already implied
  by the page itself); it still renders normally on other aircraft pages/CTAs.
- `alert_subscribed` fires with `source: 'deals_page'` on submit.
- No schema change. No change to `parseSourcePath`/`alertMatchCounts.ts`/digest cron.
- Build + typecheck clean; QA smoke passes desktop 1280 + mobile 375 on `/aircraft/deals`,
  zero console errors, zero horizontal overflow.

## Out of scope
- Deal-only filtering on any other page.
- The `AlertSignup` widen-suggestion / social-proof lines on this page (no established
  comps data needed here beyond the existing honest matchCount).
- Any change to how `fetchUnderMarketDeals` computes deals.
