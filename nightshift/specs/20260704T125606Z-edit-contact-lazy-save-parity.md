# edit-contact-lazy-save-parity

## Goal
Make the 3 listing-edit server actions lazy-save `contact_name`/`contact_phone` into
`user_metadata` on success, the same way the 3 create actions already do — so a poster
who first fills in their name/phone while *editing* an existing listing still gets it
prefilled on their next new post, instead of the field silently staying blank forever.

## Scope
- `src/app/actions.ts`:
  - `updatePartnershipListing` — add the same `full_name`/`contact_phone` lazy-save
    block `createPartnership` already has (mirrors lines ~181-193), placed after the
    update succeeds.
  - `updateSeekerListing` — same block, mirroring `createSeekerListing` (~467-478).
  - `updateAircraftListing` — `contact_phone`-only lazy-save (this form has no name
    field), mirroring `createAircraftListing` (~690-694).
- No UI changes, no schema changes. Pure parity fix in existing server actions.

## Acceptance criteria
- All 3 update actions call `supabase.auth.updateUser({ data: { ... } })` for
  `full_name`/`contact_phone` exactly when the corresponding create action would (only
  when the submitted value is non-empty AND `user_metadata` doesn't already have it).
- No change to the listing-row payload itself (contact_name/contact_phone continue to
  be written to the row exactly as before).
- `npx tsc --noEmit` and `npx next build` pass clean.
- QA smoke passes on the 3 edit routes + their `new` counterparts (regression check) at
  desktop 1280 + mobile 375: HTTP 200 (logged-out → redirects to `/auth`, expected), zero
  app-origin console errors, zero horizontal overflow.

## Out of scope
- Any UI/copy change.
- The seeker-photo-upload and aircraft-contact-fields ideas flagged in prior cycles as
  needing a human product call — not touched.
- Any auth/session logic — only the existing `supabase.auth.updateUser` metadata-write
  pattern already used elsewhere in this same file.
