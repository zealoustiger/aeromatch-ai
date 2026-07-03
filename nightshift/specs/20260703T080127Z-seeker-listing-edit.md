# Spec: seeker-listing-edit

## Goal
Complete edit-flow parity across all three post types by adding an edit flow for
user-posted "pilot seeking a partnership" listings — the last of the three
(`aircraft_for_sale`, `partnerships`, `partnership_seekers`) still missing an
`update*Listing` action, mirroring `updateAircraftListing`/`updatePartnershipListing`.

## Scope
- `src/app/actions.ts` — new `updateSeekerListing(id, formData)` server action.
  Mirrors `createSeekerListing`'s column set + derivation logic (home airport →
  airport_name/city/state lookup, csv-list fields, additional_airports graceful
  fallback), but updates in place and is ownership-scoped
  (`.eq('poster_id', user.id)`), same pattern as `updatePartnershipListing`.
- `src/components/PostSeekerListingForm.tsx` — add `mode`, `listingId`,
  `initialValues` props (mirrors `PostPartnershipForm`'s edit-mode shape): prefill
  all fields via `defaultValue`, submit routes to `updateSeekerListing` when
  editing, button label/copy switches to "Save Changes", draft key scoped per
  listing (`ch:draft:seeker-edit:${listingId}`), "Start over" becomes "Revert
  changes" with the edit-appropriate confirm copy, `?next=` on the deferred-auth
  redirect points back to the edit URL.
- `src/app/partnerships/seeking/[id]/edit/page.tsx` — new page: auth-gate,
  ownership-scoped fetch (404 for missing/not-owned, same response either way),
  renders `PostSeekerListingForm` in edit mode.
- `src/app/listings/page.tsx` — add an "Edit" link next to "View" in the seekers
  section (line ~268-274), matching the aircraft/partnership sections.
- `src/app/partnerships/seeking/[id]/page.tsx` — add a `justUpdated` banner (reads
  `?updated=1`) mirroring the partnership detail page's "changes saved" banner.

## Acceptance criteria
- A logged-in owner of a seeker listing sees an "Edit" link on `/listings` next to
  "View" in the "Pilots seeking" section.
- `/partnerships/seeking/[id]/edit` renders the seeker form prefilled with the
  listing's current values (airports, budget, aircraft prefs, pilot profile,
  contact info, title/description).
- Saving updates the row in place and redirects to
  `/partnerships/seeking/[id]?updated=1`, which shows a "changes saved" banner.
- Visiting another user's seeker edit URL, or a nonexistent id, 404s (same
  response either way). Visiting while logged out redirects to
  `/auth?next=/partnerships/seeking/[id]/edit`.
- The create flow (`/partnerships/seeking/new`) is unchanged — same draft key,
  same behavior for a logged-out or first-time poster.
- `npx next build` + typecheck pass; QA smoke passes on
  `/listings`, `/partnerships/seeking/new` (regression), the edit page, and the
  seeker detail page.

## Out of scope
- Photo upload for seeker listings (seeker listings have no photos today).
- Any change to `createSeekerListing`, `deactivateListing`, or `relistListing`.
- Any change to aircraft/partnership edit flows (already shipped).
