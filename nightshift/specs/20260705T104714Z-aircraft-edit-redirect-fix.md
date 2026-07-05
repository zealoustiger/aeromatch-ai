# aircraft-edit-redirect-fix

## Goal
Fix `PostAircraftForm.tsx`'s `redirectToAuth()` so a logged-out (or session-expired)
user editing an existing aircraft listing is bounced back to their edit page, not the
blank "post a new aircraft" form — matching the partnership and seeker edit forms,
which already branch on `isEdit` for this.

## Scope
- `src/components/PostAircraftForm.tsx` — `redirectToAuth()` (~line 262-264): change
  the hardcoded `router.push('/auth?next=/aircraft/new')` to branch on `isEdit`/
  `listingId`, mirroring `PostPartnershipForm.tsx:477-479` and
  `PostSeekerListingForm.tsx:341-343`.
- No other files. No schema, action, or auth-file changes (`src/app/auth/**` untouched).

## Acceptance criteria
- On `/aircraft/new` (not editing), triggering `redirectToAuth()` (submit while
  logged out, or photo-upload auth gate) still redirects to
  `/auth?next=/aircraft/new` — unchanged behavior.
- On `/aircraft/listing/[id]/edit`, triggering `redirectToAuth()` redirects to
  `/auth?next=/aircraft/listing/{id}/edit` instead of `/aircraft/new`.
- `npx next build` + typecheck pass.
- QA smoke (`qa-smoke.mjs`) passes on `/aircraft/new` and an existing aircraft
  listing's `/edit` page at desktop 1280 + mobile 375: HTTP 200, no console errors,
  no horizontal overflow.
- No visible UI change — this is a redirect-target fix only (non-visual cycle).

## Out of scope
- Adding a live/client-side auth-state listener to the edit forms (the broader
  "stale isLoggedIn on session expiry" issue) — flagged as a separate, larger
  follow-up in the CHANGELOG `Next` note.
- Any change to `src/app/auth/**` or the auth flow itself.
