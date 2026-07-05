# Block submit while a photo is still uploading

## Goal
Stop the aircraft/partnership post forms from publishing a listing while one or more
photos are still mid-upload, so a photo never silently vanishes from the published listing.

## Context / bug
`PartnershipPhotoUpload` (shared by the aircraft and partnership post/edit forms) only
renders a hidden `photo_url` input for photos whose upload has resolved
(`successPhotos = photos.filter(p => p.url)`, `src/components/PartnershipPhotoUpload.tsx:247,399`).
Neither `PostAircraftForm.tsx` nor `PostPartnershipForm.tsx` tracks the uploader's
in-flight state — the submit button's only `disabled` condition is the server action's
own `pending` flag (`PostAircraftForm.tsx:750`, `PostPartnershipForm.tsx:936`). A seller
who taps "Post Aircraft for Sale" / "Post Partnership Listing" before an in-flight upload
(commonly 1-3s, longer on mobile networks) resolves gets the listing published with that
photo silently dropped — no error, no notice.

## Scope
- `src/components/PartnershipPhotoUpload.tsx` — add an optional `onUploadingChange`
  prop, invoked (via `useEffect` on `photos`) with the current count of photos where
  `uploading === true`.
- `src/components/PostAircraftForm.tsx` — track uploading count in state, pass
  `onUploadingChange`, and factor it into the submit button's `disabled` + label.
- `src/components/PostPartnershipForm.tsx` — same treatment (identical pattern).
- Seeker form is unaffected (no photo uploader).

## Acceptance criteria
- While any photo is uploading, the submit button on the aircraft and partnership
  post/edit forms is disabled and shows a distinct label (e.g. "Uploading photos…"),
  not just the existing `pending`/"Saving…" state.
- Once all photos resolve (success or error), the button re-enables (assuming the rest
  of the form is otherwise submittable) and shows its normal label.
- A form with zero photos, or all-already-uploaded photos, behaves exactly as before
  (no regression to existing submit behavior).
- No change to upload endpoints, server actions, or the photo data model.
- `npx next build` + typecheck pass; no new console errors on either form.

## Out of scope
- Seeker post form (no photo uploader).
- Any change to how errored photos are handled (still shown inline, still removable).
- Auto-retry of failed uploads.
