# partnership-photos-survive-auth

## Goal
Stop the partnership post form from silently dropping a logged-out poster's uploaded
photos across the deferred-auth (sign-in) redirect — bring it to parity with the
aircraft form, which already persists photos.

## Context
The aircraft post form (`PostAircraftForm`) passes `persistKey` + `restoreGateKey` to
`PartnershipPhotoUpload`, so a logged-out seller's uploaded photo URLs are mirrored to
localStorage and restored when they return from `/auth` (shipped via
`post-photos-survive-auth`, 2026-06-28). The partnership form
(`PostPartnershipForm`) renders the **same** uploader but passes neither prop, so a
logged-out partnership poster who adds photos, then clicks "Sign in to Publish", loses
every photo on return — even though their text draft is restored. This is a real
data-loss across the value-moment gate (GOAL.md Pillar 1 + the "nothing is dropped"
guardrail). The uploader already fully supports these props; this is a wiring + parity fix.

## Scope (small)
- `src/components/PostPartnershipForm.tsx` only:
  - Add a `PHOTOS_KEY` derived from the existing `DRAFT_KEY` (mirror the aircraft form).
  - Pass `persistKey={PHOTOS_KEY}` and `restoreGateKey={DRAFT_KEY}` to
    `<PartnershipPhotoUpload>`.
  - In `handleStartOver`, also remove `PHOTOS_KEY` from localStorage (parity with the
    aircraft form's Start-over, so clearing the draft clears persisted photos too).

## Acceptance criteria
- `npx next build` + typecheck pass.
- The partnership uploader receives `persistKey` + `restoreGateKey`; uploaded partnership
  photo URLs are written to `localStorage['ch:draft:partnership-new:photos']` and restored
  on mount **only** while the text-draft key exists (no stale photos after publish clears it).
- "Start over" removes the photos key so cleared drafts don't leave orphaned photo refs.
- No change to the uploader component, the server action, the data model, or any endpoint.
- QA smoke passes on `/partnerships/new` (HTTP 200, no app-console errors, no overflow at
  1280 + 375).

## Out of scope
- The seeker form (`PostSeekerListingForm`) — it has no photo uploader, nothing to persist.
- The aircraft form — already done.
- Any change to `PartnershipPhotoUpload`, upload endpoints, or `createPartnership`.
- Photo persistence for logged-in users beyond what the existing localStorage mirror gives.
