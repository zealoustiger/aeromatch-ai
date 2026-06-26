# Spec: partnership-photo-upload

**UTC:** 2026-06-26T103614Z  
**Lane:** [want] — last 3 non-bug cycles: [want], [want], [goal] → [want] owed per 3:1 policy

## Goal
Let users upload real photos when posting a partnership listing. Photos appear in the existing PhotoGallery on the detail page.

## Scope
- New `/api/upload-partnership-photo` POST route — auth-gated, validates image type/size, uploads to `listing-images/partnership-photos/{userId}/{uuid}.{ext}` via admin client, returns public URL
- New `PartnershipPhotoUpload` client component — click-to-browse file input + drag-and-drop, thumbnail previews with remove, uploading state, max 5 photos, 5MB each, JPEG/PNG/WebP only; renders hidden `photo_url` inputs for each uploaded URL
- `PostPartnershipForm.tsx` — add "Photos (optional)" section (above Listing Details) with the upload component
- `actions.ts` `createPartnership` — read `photo_url` from formData and include in `images` array

## Acceptance criteria
1. User can click "Add photos" or drag files onto the drop zone to select up to 5 images
2. Each selected image uploads immediately; a thumbnail previews with a spinner while uploading, then shows the real image
3. A remove button on each thumbnail removes it from the pending set
4. On form submit, `createPartnership` writes the uploaded URLs into `partnerships.images[]`
5. The partnership detail page (`/partnerships/[id]`) already renders `PhotoGallery` — uploaded photos appear there immediately after posting
6. Non-images or files > 5MB are rejected inline with a clear error; the form is not broken
7. `npx next build` clean + `qa-smoke` exit 0 on `/partnerships/new` at desktop 1280 + mobile 375

## Out of scope
- Reorder/drag photos
- Edit flow (adding/removing photos from an existing listing)
- Progress bars (spinner per photo is sufficient)
- Applying to aircraft or seeker post forms (future slice)
