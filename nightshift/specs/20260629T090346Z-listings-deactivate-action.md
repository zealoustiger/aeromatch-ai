# Spec: listings-deactivate-action

**Timestamp:** 20260629T090346Z
**Slug:** listings-deactivate-action
**Pillar:** Frictionless listing posting (Pillar 1)

## Goal
Let a listing owner close/deactivate their own listing directly from the `/listings` management page, without needing support.

## Context
The `/listings` page now shows all three listing types (aircraft, partnerships, seeker) but only has a "View →" link. A seller whose plane sold, or a partnership owner whose spot was filled, currently has no way to remove their listing from ClubHanger. This is a management gap that makes the post flow feel incomplete.

## Scope (files to touch)
- `src/app/actions.ts` — add `deactivateListing(type, id)` server action
- `src/components/DeactivateListingButton.tsx` — new client component (confirm + call action)
- `src/app/listings/page.tsx` — import button, add to each listing row

## Acceptance criteria
1. Each aircraft row on `/listings` has a "Mark as sold" button; clicking it (after confirm) sets `status='sold'` for that aircraft_for_sale row and the listing disappears from /listings.
2. Each partnership row has a "Close" button; clicking it sets `status='closed'` and the listing disappears.
3. Each seeker row has a "Deactivate" button; clicking it sets `status='closed'` and disappears.
4. The action is owner-gated: server checks `poster_id = user.id` (defense-in-depth beyond RLS).
5. A `window.confirm` dialog prevents accidental clicks ("Mark as sold? This will remove your listing from ClubHanger.").
6. A spinner / "Closing…" state prevents double-submission while the action is in flight.
7. Smoke passes at desktop 1280 + mobile 375 on `/listings` (HTTP 200, zero app-origin errors, zero horizontal overflow).

## Out of scope
- Full "edit listing" flow (too large for one cycle; deactivate is the key management action)
- Un-deactivating / reactivating a listing
- Any change to /aircraft/listing/[id], /partnerships/[id], or /partnerships/seeking/[id] pages
- Schema changes (status columns already exist on all three tables)
