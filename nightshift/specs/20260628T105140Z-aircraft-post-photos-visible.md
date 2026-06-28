# aircraft-post-photos-visible

## Goal
Surface the photo uploader on the aircraft post form (`/aircraft/new`) as an
always-visible section instead of hiding it inside the collapsed "More details
(optional)" disclosure — photos are the single highest-value element of a listing,
and a buyer scrolls past a photoless listing.

## Scope (Pillar 1 — frictionless posting)
- `src/components/PostAircraftForm.tsx` — move the existing **Photos** block out of
  the `<details>` element into its own always-visible `<section>` between the main
  fields section and the "More details" disclosure. No change to the uploader
  component, endpoints, or any other field.

## Acceptance criteria
- The Photos uploader (`PartnershipPhotoUpload`, endpoint `/api/upload-aircraft-photo`)
  renders on initial page load **without** expanding "More details".
- The "More details (optional)" disclosure still exists and still contains the
  Aircraft specs (Year/TTAF/SMOH) and Listing details (Title/Description) blocks.
- The N-number lookup / AI-prefill auto-open logic for "More details" is unchanged
  (photos are not a form field there, so the `hasOptional` check is unaffected).
- Page builds + typechecks clean; `/aircraft/new` returns 200 with no new console
  errors and no horizontal overflow at 1280 + 375.
- The new Photos section uses the same card styling as the existing main section
  (rounded-xl border, white bg, shadow) so the form stays cohesive.

## Out of scope
- The partnership post form (`/partnerships/new`) — leave its photo placement as-is
  this cycle (one scoped change).
- Any change to the uploader component, upload endpoints, MAX_PHOTOS, or accepted types.
- "Paste & prefill from URL" (the other open Pillar 1 slice) — separate cycle.
