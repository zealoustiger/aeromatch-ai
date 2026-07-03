# partnership-listing-edit

## Goal
Let a poster edit an already-published partnership listing (mirrors the aircraft edit flow shipped last cycle), closing the same "posting is a one-way door" gap for Pillar 1.

## Scope
- `src/app/actions.ts` — add `updatePartnershipListing(id, formData)`, ownership-scoped (`.eq('poster_id', user.id)`), mirroring `createPartnership`'s column set/derivation but updating in place. Unlike aircraft, `partnerships.home_airport` stores the raw ICAO directly (not just derived city/state), so the edit form can prefill and safely re-derive `airport_name`/`city`/`state` on every save — no "only touch if resupplied" special case needed.
- `src/components/PostPartnershipForm.tsx` — add `mode`/`listingId`/`initialValues` props (same shape as `PostAircraftForm`), branch the `useActionState` action between `createPartnership`/`updatePartnershipListing`, prefill fields via `defaultValue`, scope the draft-autosave key per listing when editing, swap submit button copy ("Save Changes"), swap "Start over" copy to "Revert changes" in edit mode.
- `src/app/partnerships/[id]/edit/page.tsx` (new) — server component: require auth (redirect to `/auth?next=...`), fetch the listing scoped to `poster_id`, 404 (same response whether missing or not-owned) otherwise, render `PostPartnershipForm` in edit mode.
- `src/app/listings/page.tsx` — add an "Edit" link next to "View" on each active partnership row, matching the existing aircraft row's Edit link.
- `src/app/partnerships/[id]/page.tsx` — add a `justUpdated` ("Your changes are saved") banner gated on `?updated=1`, mirroring the aircraft detail page's banner.

## Acceptance criteria
- A logged-in owner can visit `/partnerships/[id]/edit`, see the form prefilled with their listing's current values (make/model/year/registration/home airport/share terms/costs/specs/title/description/photos), change a field, save, and land back on `/partnerships/[id]?updated=1` with the row updated in the DB.
- Editing without re-touching the home airport still correctly keeps (or, since raw ICAO is stored, correctly re-derives) `airport_name`/`city`/`state` — no silent data loss.
- Visiting someone else's edit URL, or a nonexistent listing ID, returns the same not-found response (never reveals existence to a non-owner).
- Visiting the edit URL while logged out redirects to `/auth?next=/partnerships/[id]/edit`.
- `/listings` shows an "Edit" link on each active partnership row, linking to the new edit page.
- `npx next build` + `tsc --noEmit` are clean; no regression to `/partnerships/new` (create flow unaffected).

## Out of scope
- Seeker-listing edit (`partnership_seekers`) — left for a future cycle, same shape.
- Any change to `aircraft_for_sale`/`PostAircraftForm` (already shipped).
- Photo re-ordering/removal beyond what `PartnershipPhotoUpload` already supports.
