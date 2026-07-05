# seeker-details-contact-autoopen

## Goal
Fix `PostSeekerListingForm.tsx`'s "More details" auto-open condition (edit mode) so it also
opens when the listing has a saved `contact_name` or `contact_email`, matching the identical
check already correct on `PostPartnershipForm.tsx`.

## Scope
- `src/components/PostSeekerListingForm.tsx` — the `<details open={Boolean(...)}>` condition
  around line 588-594: add `initialValues?.contact_name` and `initialValues?.contact_email`
  to the `isEdit` OR-chain, alongside the existing `initialValues?.contact_phone` check.
- No other files. No schema/action change.

## Acceptance criteria
- Editing a seeker listing that has a saved `contact_name` or `contact_email` (but no other
  optional field populated) now renders "More details" expanded by default.
- Editing a seeker listing with none of `contact_name`/`contact_email`/`contact_phone`/other
  optional fields still renders it collapsed (no regression).
- `!isEdit` (new post) branch is untouched — confirmed already consistent with the partnership
  form (both only check `userPhone`), not part of this fix.
- `npx next build` + typecheck pass.
- QA smoke passes on `/partnerships/seeking/new` and `/partnerships/seeking/[id]/edit` (desktop
  1280 + mobile 375, HTTP 200, no console errors, no horizontal overflow).

## Out of scope
- The aircraft form's missing contact_name/contact_email fields entirely (schema-gated, human
  call — `aircraft_add_contact_phone` migration).
- Adding photo upload to the seeker form.
- The `!isEdit` branch's `userPhone`-only check (matches partnership form, not a gap).
