# seeker-save-heart

## Goal
Extend the existing save/heart ("soft save") system — already live on aircraft-for-sale and
partnership listings — to pilot-seeking listings, the one of three listing types where it's
currently structurally missing entirely (no button, not gated/401ing, just absent).

## Why (Pillar 2 — frictionless signup/auth)
The save/heart flow is the canonical "defer the signup gate to the value moment" pattern:
a guest hearts a listing (device-only soft-save), signs up later, and `mergeDeviceSaves`
carries it into their account — no lost intent. Aircraft and partnership listings both have
this end-to-end (card heart, detail-page heart, `/saved` display, guest device-save +
merge-on-signup). Seeker listings (`/partnerships/seeking/*`) never got it — an owner
browsing pilots seeking a partnership share (exactly the audience they'd want to shortlist)
has no way to bookmark one and come back later. Audit confirmed `saved_listings.listing_type`
is a plain unconstrained `text` column, so this is app-layer only — no migration needed.

## Scope
- `src/lib/localSaves.ts` — add `'seeker'` to `LocalSaveType`.
- `src/app/actions.ts` — add `'seeker'` to `SAVED_LISTING_TYPES`; extend `hydrateDeviceSaves`
  to also hydrate seeker ids and return a `seekers` array.
- `src/lib/seekersQuery.ts` — add `getSeekerById` / `getSeekersByIds` (mirrors
  `getPartnershipsByIds`/`getAircraftForSaleByIds`; order-preserving, drops missing/inactive,
  mock-data fallback).
- `src/components/SaveListingButton.tsx` — widen `listingType` prop union to include `'seeker'`.
- `src/components/SeekerCard.tsx` — restructure so the heart button is a sibling of the card's
  `<Link>` (not nested — same "sibling of the Link" pattern `PartnershipCard`/`AircraftSaleCard`
  use), accept a `saved` prop.
- `src/components/SeekerList.tsx` — hydrate the signed-in viewer's saved-seeker ids (mirrors
  `PartnershipList`'s `savedIds` query) and pass `saved` to each `SeekerCard`.
- `src/app/partnerships/seeking/[id]/page.tsx` — query `savedRowId` for this seeker listing
  (mirrors the aircraft/partnership detail pages) and mount a `variant="full"` `SaveListingButton`.
- `src/app/saved/page.tsx` — add a "Saved seeker listings" section (logged-in path).
- `src/components/DeviceSavedListings.tsx` — add the same section for the logged-out/device path.

## Acceptance criteria
- A logged-out visitor can heart a seeker card (on `/partnerships/seeking`) or the seeker
  detail page; it soft-saves to the device (`localStorage`) exactly like aircraft/partnership.
- `/saved` (logged out) shows device-saved seeker listings in their own section.
- A logged-in user can heart/un-heart a seeker listing from the card, the list, and the detail
  page; the heart state persists (`saved_listings` row) and reflects correctly on reload.
- `/saved` (logged in) shows a "Saved seeker listings" section for real DB saves.
- Existing aircraft/partnership save behavior is unchanged (same components, additive prop/type
  widening only — no behavior change to the `'partnership'`/`'aircraft'` paths).
- `npx next build` + typecheck pass; QA smoke passes on `/partnerships/seeking`,
  `/partnerships/seeking/[id]` (a real id), and `/saved`.

## Out of scope
- Merge-on-signup for seeker device-saves is automatically covered by the existing
  `mergeDeviceSaves`/`DeviceSaveSync` machinery (type-agnostic) — no new code needed there,
  but verify it during QA rather than assuming.
- Saved-listing notes (`SavedListingNote`) for seeker saves — not requested, leave seeker rows
  without the note affordance parity check (existing note UI is generic per-row already; if it
  "just works" via the existing `notesEnabled && meta` check, fine, but not a hard requirement).
- Any change to `src/app/auth/**` or the auth flow itself (frozen).
