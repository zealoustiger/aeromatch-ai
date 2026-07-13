# See the N matching listings — CTA on `/alerts/status`'s confirmed panel

## Goal
Turn the confirmed alert panel's live match count from dead text into a clickable "See the N matching listings →" link (or "See this listing →" for a watch alert), so confirming actually leads somewhere.

## Scope
- `src/app/alerts/status/page.tsx` only:
  - Capture the `match` result computed at line 116 (`getAlertMatchCount(data.source_path)`) into a variable that survives past the `if (data?.source_path)` block, instead of only feeding the `confirmedBody` sentence.
  - Import `isListingWatchPath` from `@/lib/alertWatchStatus`.
  - In the confirmed-state JSX (after the body paragraph, before `AlertStatusTracker`/cross-sell), render:
    - If `confirmedMatchCount` is non-null and `confirmedSourcePath` exists → `<Link href={confirmedSourcePath}>See the N matching listing(s) →</Link>` (reuse the same singular/plural noun logic already used for the sentence).
    - Else if `confirmedSourcePath` exists and `isListingWatchPath(confirmedSourcePath)` → `<Link href={confirmedSourcePath}>See this listing →</Link>`.
    - Else: render nothing new (unchanged behavior).
- No new capture point, no new PostHog event, no schema change, no new data fetch (reuses the existing `getAlertMatchCount` call already made for the sentence copy).

## Acceptance criteria
- A confirmed alert whose `source_path` is a real browsable search/SEO page and has ≥1 live match shows a working "See the N matching listing(s) →" link pointing at that `source_path`.
- A confirmed watch alert (`?watch=price` source_path) shows a "See this listing →" link pointing at the listing detail page (no live match count is claimed, since `getAlertMatchCount` returns `null` for watch shapes).
- A confirmed alert with 0 live matches shows no CTA link (nothing to send someone to look at) — unchanged from today, no dead/misleading link.
- No change to `unsubscribed`, `weekly`, or `invalid` states.
- `npx tsc --noEmit` and `npx next build` both stay green.
- `/alerts/status` (all states reachable via query params) passes `qa-smoke.mjs` at desktop 1280 + mobile 375 with zero console errors / zero overflow.

## Out of scope
- The other two `[P2][goal]` alert-experience backlog items (digest cross-sell suggestion, recently-viewed smart alert).
- Any change to `alertMatchCounts.ts` / `alertWatchStatus.ts` internals — pure reuse.
