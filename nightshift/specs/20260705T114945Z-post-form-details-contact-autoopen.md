# post-form-details-contact-autoopen

## Goal
Make the aircraft and partnership post/edit forms' collapsed "More details" section
auto-open in edit mode when a saved contact field (phone/name/email) already has data,
matching the seeker form's existing correct behavior — so a returning editor's saved
contact info is never hidden behind an unexpanded `<details>` with no visual cue.

## Scope
- `src/components/PostAircraftForm.tsx` — the `open={...}` boolean on the "More details"
  `<details>` (~line 664-671): add `initialValues?.contact_phone` to the `isEdit` OR-chain.
- `src/components/PostPartnershipForm.tsx` — the equivalent `open={...}` boolean
  (~line 734-743): add `initialValues?.contact_phone`, `initialValues?.contact_name`,
  `initialValues?.contact_phone`, and `initialValues?.contact_email` to the `isEdit`
  OR-chain (all three contact fields live inside this same collapsed section, confirmed
  by matching `<details>`/`</details>` line ranges).
- No changes to `PostSeekerListingForm.tsx` — it already includes `contact_phone` in its
  auto-open check (line 573); used as the reference/correct behavior.

## Acceptance criteria
- Editing an existing aircraft listing that has a saved `contact_phone` but no other
  optional-details fields (year/ttaf/smoh/etc.) now renders "More details" **expanded**
  on page load.
- Editing an existing partnership listing that has a saved `contact_name`,
  `contact_email`, or `contact_phone` but no other optional-details fields now renders
  "More details" **expanded** on page load.
- Editing a listing with none of the extended contact/optional fields set still renders
  "More details" **collapsed** (no regression to the existing behavior for the common case).
- The "new post" (non-edit) auto-open behavior (`!isEdit && userPhone`) is unchanged.
- `npx next build` passes cleanly (typecheck + build).
- QA smoke passes on `/aircraft/new`, `/aircraft/listing/[id]/edit`, `/partnerships/new`,
  `/partnerships/[id]/edit` at desktop 1280 + mobile 375 (HTTP 200, no console errors,
  no horizontal overflow).

## Out of scope
- Any change to the seeker form (already correct).
- Any change to `AirportAutocompleteInput.tsx` (unrelated browse/filter component).
- Any auth/session-state work (that's a separate, Pillar 2 gap being tracked elsewhere).
- Restyling or restructuring the "More details" section itself.
