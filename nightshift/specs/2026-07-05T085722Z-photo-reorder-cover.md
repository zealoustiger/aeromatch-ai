# photo-reorder-cover

## Goal
Let a poster reorder uploaded photos (and thus pick the cover/thumbnail photo) directly in
`PartnershipPhotoUpload`, instead of the only current option — delete and re-upload in the
right order — which is friction on the aircraft and partnership post/edit forms.

## Scope
- `src/components/PartnershipPhotoUpload.tsx`:
  - Add a `movePhoto(key, direction: 'left' | 'right')` that swaps a thumbnail with its
    neighbor in the `photos` state array (order already drives the hidden `photo_url`
    inputs submitted to the form action, which already determines the cover photo via
    `pickRealPhoto` picking the first usable image — no schema/action change needed).
  - Add small left/right move buttons on each thumbnail (only rendered when there are 2+
    photos), disabled/hidden at the array edges, with `aria-label`s.
  - Add a small "Cover" badge on the first thumbnail (only when 2+ photos) so it's clear
    why order matters.
- No changes to `src/app/actions.ts`, upload endpoints, or any other file — this is a
  self-contained client-component change consumed identically by both
  `PostAircraftForm.tsx` and `PostPartnershipForm.tsx` (create + edit modes for both).

## Acceptance criteria
- With 2+ photos uploaded, each thumbnail (except the first) shows a "move left" control,
  and each thumbnail (except the last) shows a "move right" control.
- Clicking move-left/move-right swaps that photo with its neighbor; the underlying hidden
  `photo_url` inputs re-render in the new order (verified by inspecting DOM order or by the
  visual thumbnail order updating).
- The first thumbnail shows a "Cover" badge only when there are 2+ photos (no badge with a
  single photo, since order is moot).
- With exactly 1 photo, no move buttons or badge render (no behavior change from today).
- `npx next build` + typecheck pass; QA smoke passes on `/aircraft/new` and
  `/partnerships/new` (desktop 1280 + mobile 375, no console errors, no horizontal overflow).
- No schema change, no server action change, no change to upload/removal/paste/drag logic.

## Out of scope
- Drag-and-drop reordering (arrow buttons are simpler and more reliable on mobile/touch).
- Persisting a distinct "is_cover" flag in the DB — order-in-array is already the existing
  cover mechanism (`pickRealPhoto` picks the first usable image), so no schema is needed.
- The seeker post form (no photo upload there).
