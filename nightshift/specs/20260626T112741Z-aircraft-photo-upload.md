# Spec: aircraft-photo-upload
**Timestamp:** 20260626T112741Z
**Lane:** [want] — natural slice 2 of the `[P2][want]` multi-photo upload item (slice 1 shipped `partnership-photo-upload`)

## Goal
Add the same drag-and-drop multi-photo upload to `/aircraft/new` that was just shipped for `/partnerships/new`, so sellers listing their own aircraft can include real photos.

## Scope
- `src/components/PartnershipPhotoUpload.tsx` — add optional `endpoint` prop (default `/api/upload-partnership-photo`); backward-compatible
- `src/app/api/upload-aircraft-photo/route.ts` — new API route: identical auth + validation logic, stores under `aircraft-photos/` subfolder
- `src/components/PostAircraftForm.tsx` — add "Photos (optional)" section between Aircraft Details and Listing Details, using `PartnershipPhotoUpload` with the aircraft endpoint
- `src/app/actions.ts` — update `createAircraftListing` to read `photo_url` form fields and set `images` + `image_is_placeholder`

## Acceptance criteria
- [ ] `/aircraft/new` (when signed in) shows a "Photos (optional)" section with the same drag-and-drop zone, thumbnail previews, remove buttons, and "Add another" tile as `/partnerships/new`
- [ ] Photos upload to Supabase Storage under `listing-images/aircraft-photos/` via the new `/api/upload-aircraft-photo` endpoint (auth-gated, type + size validated)
- [ ] On form submit, uploaded photo URLs populate `aircraft_for_sale.images[]` and `image_is_placeholder` is set to `false`; submitting without photos leaves `images: []` and `image_is_placeholder: true` (existing behavior)
- [ ] The partnership form is unaffected — `PartnershipPhotoUpload` used with no props still calls `/api/upload-partnership-photo`
- [ ] Build is green (no TypeScript errors)
- [ ] QA smoke passes on `/aircraft/new` at 1280 + 375px (HTTP 200, no console errors, no overflow)

## Out of scope
- Remove/reorder photos after upload (edit flow) — slice 2
- Rate-limiting the upload endpoint
- Applying the uploader to the seeking-partnership form
