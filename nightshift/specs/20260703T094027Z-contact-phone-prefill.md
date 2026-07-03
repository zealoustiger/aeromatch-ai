# contact-phone-prefill

## Goal
Stop making a signed-in user retype their phone number on every listing they post — persist it to `user_metadata` on first submit (mirroring the existing `contact_name` → `user_metadata.full_name` pattern) and prefill it on all three post forms thereafter.

## Scope
- `src/app/actions.ts`: in `createPartnership`, `createSeekerListing`, and `createAircraftListing`, after a successful insert, lazily save a trimmed `contact_phone` into `user_metadata.contact_phone` when the user doesn't already have one saved (same "only if not already set" guard as the `full_name` save).
- `src/app/aircraft/new/page.tsx`, `src/app/partnerships/new/page.tsx`, `src/app/partnerships/seeking/new/page.tsx`: read `user?.user_metadata?.contact_phone` and pass it as a new `userPhone` prop to the respective form.
- `src/components/PostAircraftForm.tsx`, `src/components/PostPartnershipForm.tsx`, `src/components/PostSeekerListingForm.tsx`: accept a new optional `userPhone?: string` prop; change the `contact_phone` input's `defaultValue` to `initialValues?.contact_phone ?? userPhone ?? ''`; add the same "We'll save your name/phone for future listings" style hint under the field when it's freshly prefilled (mirrors the existing name hint).

## Out of scope
- No DB schema/migration — this reuses Supabase auth `user_metadata`, not a new table column (avoids the "human must run DDL" limbo the prior `contact_phone` column migration is stuck in).
- Not touching `updatePartnershipListing`/`updateSeekerListing`/`updateAircraftListing` (edit actions) — edit mode already prefills `contact_phone` from the listing itself via `initialValues`, so there's nothing to add there.
- No changes to contact_name/contact_email prefill (already shipped).
- No unified post-type chooser page (separate, larger idea — noted for a future cycle).

## Acceptance criteria
- [ ] `npx next build` + `tsc --noEmit` pass with zero errors.
- [ ] A signed-in user who has never saved a phone still sees a blank Phone field (no crash on missing metadata).
- [ ] After submitting any one of the 3 forms with a phone number filled in, `user_metadata.contact_phone` is set (once — doesn't overwrite a phone number already saved from a prior listing).
- [ ] The next time that same user opens any of the 3 "new" post forms, the Phone field is prefilled from `user_metadata.contact_phone`.
- [ ] Editing an existing listing still prefills Phone from the listing's own stored `contact_phone` (via `initialValues`), not from `user_metadata` — no regression to edit mode.
- [ ] QA smoke passes (HTTP 200, no console errors, no horizontal overflow) at desktop 1280 + mobile 375 on `/aircraft/new`, `/partnerships/new`, `/partnerships/seeking/new`.
