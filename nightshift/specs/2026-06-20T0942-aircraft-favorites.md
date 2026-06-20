# Aircraft favorites — heart button on planes-for-sale (slice 1)

## Goal
Add a Save/favorite heart button to the for-sale `AircraftSaleCard` on `/aircraft`
and `/aircraft/[make]/[model]`, wired to the SAME favorites plumbing the partnership
cards already use (no parallel system).

## Context (verified, no change needed)
- `saved_listings` table exists with `listing_type` column (default `'partnership'`,
  supports `'aircraft'` via `unique(user_id, listing_id, listing_type)`) — `supabase/schema.sql:358`.
- `aircraft_for_sale.id` is `uuid`, compatible with `saved_listings.listing_id uuid`.
- `toggleSavedListing(listingId, listingType)` already whitelists `'aircraft'`
  (`SAVED_LISTING_TYPES`) — `src/app/actions.ts:225`.
- `SaveListingButton` already accepts `listingType?: 'partnership' | 'aircraft'` and
  handles logged-out → `/auth?next=<path>` gate, logged-in → toggle, filled sky heart.
- Partnership card heart pattern (to mirror): `SaveListingButton` rendered as an
  absolutely-positioned sibling of the photo `Link` at `right-2 top-2 z-10`,
  `variant="icon"`, `initialSaved={saved}` — `src/components/PartnershipCard.tsx:49-52`.
- Saved-id hydration pattern (to mirror): `PartnershipList` fetches the signed-in
  user's saved `listing_id`s filtered by `listing_type='partnership'` and passes
  `saved={savedIds.has(p.id)}` per card — `src/components/PartnershipList.tsx:24-46,77`.

## Scope (files to touch — small)
- `src/components/AircraftSaleCard.tsx` — add the heart on the photo (sibling of the
  photo `<a>`, top-right), `listingType="aircraft"`, `initialSaved` from a new prop.
- `src/components/AircraftSaleList.tsx` — hydrate the viewer's saved aircraft ids
  (mirror PartnershipList) and thread `saved` to each card.

## Acceptance criteria
1. Heart renders on every for-sale card on `/aircraft` and `/aircraft/[make]/[model]`,
   top-right of the photo, not colliding with the Compare toggle (which sits in the
   badges row in the content column).
2. Logged-out heart click routes to `/auth?next=<current path>` (registration gate).
3. Logged-in click toggles `saved_listings` with `listing_type='aircraft'` and the
   aircraft's id, via the existing `toggleSavedListing` action; saved → filled sky heart.
4. The existing `/saved` partnerships view still works (no regression).
5. `npx next build` + `npx tsc --noEmit` pass (only the 3 known pre-existing
   `.test.ts` import-extension errors allowed); no new errors in touched files.
6. No console/hydration errors; zero horizontal overflow at 375px.

## Out of scope
- Surfacing saved aircraft on `/saved` (that's slice 2).
- Any schema/DB change (table/column already exist).
- Any new favorites component or action (reuse existing).
- The `/aircraft/for-sale/[state]` page is not a required target, but since it reuses
  the same shared `AircraftSaleList`/`AircraftSaleCard`, the heart will also appear
  there consistently — acceptable, additive, same plumbing.
