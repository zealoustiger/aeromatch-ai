# Spec: aircraft-threads-in-inbox

**Timestamp:** 20260626T122539Z  
**Slug:** aircraft-threads-in-inbox

## Goal
Wire aircraft-for-sale threads into the messages inbox and thread view so that conversations started via the "Message seller" CTA on aircraft listings actually appear and show listing context.

## Background
The `aircraft-listing-contact` cycle (2026-06-26T120154Z) shipped the "Message seller" button and `getOrCreateAircraftThread` action, which inserts `threads` rows with `aircraft_for_sale_id` set. However, neither `/messages` (inbox) nor `/messages/[threadId]` (thread view) query the `aircraft_for_sale` relationship — so aircraft threads are invisible in the inbox and show "Deleted listing" in the thread header. Without this fix the Message seller CTA is essentially broken.

## Scope
- `src/app/messages/page.tsx` — add `aircraft_for_sale` to the thread select; surface listing title/subtitle in the inbox row
- `src/app/messages/[threadId]/page.tsx` — add `aircraft_for_sale` to the thread select; show listing title + link in the thread header

## Acceptance criteria
1. Aircraft threads appear in the `/messages` inbox (alongside partnership and seeker threads, sorted by recency).
2. Each aircraft thread row shows the listing title and year/make/model as subtitle.
3. The thread view header shows the aircraft listing title, linked to `/aircraft/listing/[id]`.
4. Partnership and seeker threads are visually unchanged.
5. `npx next build` and typecheck pass.
6. QA smoke exit 0 on `/messages` + `/messages` (desktop + mobile).

## Out of scope
- Unread-badge for aircraft threads (separate follow-on)
- Email notifications for aircraft threads
- Any DB schema changes (aircraft_for_sale_id column already exists from prior cycle)
