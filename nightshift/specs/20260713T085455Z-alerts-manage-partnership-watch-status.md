# alerts-manage-partnership-watch-status

## Goal
`/alerts/manage` correctly displays live status for a "watch this partnership's buy-in"
alert (`/partnerships/<id>?watch=price`), instead of falling through to generic
degradation, matching the aircraft-watch display already shipped.

## Scope
- `src/lib/alertWatchStatus.ts` — teach `getWatchedListingStatus` to also recognize the
  partnership watch shape (`/partnerships/<id>?watch=price`), resolving against the
  `partnerships` table (make/model/share_type/buy_in_price/status) instead of
  `aircraft_for_sale`. Add a `type: 'aircraft' | 'partnership'` field to the returned
  status so the caller can pick the right link + copy.
- `src/app/alerts/manage/page.tsx` — use `watch.type` to link to `/partnerships/<id>`
  (not `/aircraft/listing/<id>`) and render partnership-appropriate copy ("No longer
  available — this watch is done" instead of "No longer for sale…", "buy-in today"
  instead of "today").
- Reuse existing `formatShareType`/`aircraftLabel` helpers from `src/lib/utils.ts`.

## Acceptance criteria
- A confirmed alert with `source_path = /partnerships/<id>?watch=price` on
  `/alerts/manage` renders "Watching: {share type} · {Make Model} — {price} buy-in
  today · View listing" linking to `/partnerships/<id>`, when the partnership is
  `status='active'`.
- The same alert renders "No longer available — this watch is done" (amber) when the
  partnership row is missing or not `status='active'`.
- The existing aircraft-watch display (`/aircraft/listing/<id>?watch=price`) is
  byte-for-byte unchanged (still "No longer for sale…", links to `/aircraft/listing/<id>`).
- Every other alert shape (family match-count rows) is unaffected.
- `tsc --noEmit` and `next build` both clean; unit tests (if any exist for this file)
  still pass.

## Out of scope
- No new capture point, no schema/migration change.
- Not touching the widen-nudge, cross-sell, or price-drop-toggle logic (already
  correctly gated off for watch-shape rows via `!watch`).
