# alerts-manage-watch-status

## Goal
Watch-alert rows on `/alerts/manage` (a subscriber watching one specific listing's
price via `/aircraft/listing/<id>?watch=price`) currently render with no honest
status line — no live price, no link back to the listing, no explanation when the
watched aircraft is no longer for sale — so give them one.

## Scope
- New `src/lib/alertWatchStatus.ts`: `isListingWatchPath()` + `getWatchedListingStatus()`
  — parses the `/aircraft/listing/<id>?watch=price` source_path shape, looks up the
  real listing (any status) via the admin client, and returns an honest
  `{ active, id, label, price }` shape (or `null` for any non-watch alert).
- `src/app/alerts/manage/page.tsx`: compute a `watchStatuses` array in parallel with
  the existing `matchCounts`, and for a watch-alert row render "Watching: {label} —
  {price} today" with a "View listing" link when active, or "No longer for sale —
  this watch is done" when not — in place of the generic live-match-count line
  (which already renders nothing for this source_path shape).

## Acceptance criteria
- A confirmed watch alert for a currently-active listing shows "Watching: {year}
  {make} {model} — {formatted price} today" plus a working link to
  `/aircraft/listing/<id>`.
- A watch alert whose listing is sold/removed/deleted shows "No longer for sale —
  this watch is done" instead of a blank line or a fabricated count.
- Non-watch alert rows (aircraft/partnership/seeker family alerts) are byte-for-byte
  unchanged — same match-count line, same Edit affordance.
- The existing Edit button continues to correctly not render for watch rows
  (`parseEditableAlertTarget` already returns `null` for this shape — no change
  needed there, just verify it still holds).
- `npx tsc --noEmit` and `npx next build` both clean.
- QA smoke passes on `/alerts/manage` at desktop 1280 + mobile 375 with zero
  console errors and zero horizontal overflow.

## Out of scope
- Any change to the cron digest's own watch-alert resolution (`resolveListingWatch`
  in `alert-digest/route.ts`) — that send path is untouched.
- Partnership "watch this partnership" parity (separate backlog item, needs its own
  schema/column work on `partnerships`).
- Any DB schema change — this is a pure read/render slice.
