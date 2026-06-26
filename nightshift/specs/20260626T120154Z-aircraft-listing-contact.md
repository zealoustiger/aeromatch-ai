# Spec: aircraft-listing-contact

**Timestamp:** 2026-06-26T120154Z  
**Slug:** aircraft-listing-contact  
**Lane:** [want]

## Goal
User-posted aircraft listings (`source='user'`) currently show "No source link available" on the detail page with no way to contact the seller. Wire up a "Message seller" CTA that reuses the platform messaging system, making user-posted aircraft fully actionable for buyers.

## Scope
Files expected to touch:
- `supabase/schema.sql` — additive migration: `aircraft_for_sale_id` column + partial unique index on `threads`
- `src/app/actions.ts` — new `getOrCreateAircraftThread(aircraftId, ownerId)` server action
- `src/components/AircraftContactButton.tsx` — new client component (Message button with auth state)
- `src/app/aircraft/listing/[id]/page.tsx` — render contact card when `source='user'` + `poster_id`

## Acceptance criteria
1. On `/aircraft/listing/[id]` where `source='user'` and `poster_id` is set, the sidebar shows a "Contact the seller" card with a dark "Message seller" button instead of "No source link available."
2. Clicking "Message seller" when signed in calls `getOrCreateAircraftThread` → navigates to `/messages/[threadId]`.
3. Clicking "Message seller" when signed out redirects to `/auth?next=/aircraft/listing/[id]`.
4. Viewing your own user-posted listing suppresses the Message button (can't message yourself) — the card shows a "Your listing" note instead.
5. All scraped listings (`source !== 'user'`) continue to show the existing "View the original listing" card unchanged.
6. `npx next build` + typecheck pass. QA smoke exit 0 on `/aircraft/listing/[id]` (any active listing) + `/aircraft` at desktop 1280 + mobile 375.

## Out of scope
- Building a new threading UI or inbox — the existing `/messages/[threadId]` handles that.
- Applying to the aircraft browse cards (the detail page CTA is the right place).
- Making the "Message" button visible on partnership pages (already done).
- Unread badge / notification for aircraft threads (future slice).
