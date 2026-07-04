# photo-upload-signin-redirect

## Goal
Fix a Pillar 2 (frictionless signup/auth) gap: a logged-out visitor who drags/pastes/browses
a photo onto any post form gets a silent, cryptic "Not authenticated" failure on the photo
thumbnail instead of the same clear, working "sign in → resume" path the rest of the form
already gives them at submit time.

## Context
`PostPartnershipForm.tsx` and `PostAircraftForm.tsx` both defer the auth gate to submit time:
if `!isLoggedIn`, `onFormSubmit` saves the draft (`forceSaveDraft`) and redirects to
`/auth?next=...` so the user resumes right where they left off. But the shared
`PartnershipPhotoUpload` component (used by both forms) has no concept of auth state — it
POSTs directly to `/api/upload-aircraft-photo` / `/api/upload-partnership-photo`, both of
which hard-require a session (401 if not). A logged-out visitor who adds a photo mid-draft
gets a small red "Not authenticated" badge on the thumbnail with no path forward — this
directly violates GOAL.md's Pillar 2 guardrail: "don't let someone do real work (post, save,
message) and then lose it because there was no account."

## Scope
- `src/components/PartnershipPhotoUpload.tsx` — add `isLoggedIn?: boolean` (default `true`)
  and `onRequireAuth?: () => void` props. When `!isLoggedIn`, `addFiles` skips the network
  call entirely and calls `onRequireAuth()` instead (covers browse/drop/paste, which all
  funnel through `addFiles`). Update the empty-state drop-zone copy/click target and the
  "add more" tile to prompt sign-in instead of opening the file picker when logged out.
- `src/components/PostPartnershipForm.tsx` / `PostAircraftForm.tsx` — factor the existing
  save-draft-and-redirect logic out of `onFormSubmit` into a small `redirectToAuth()`
  function, reuse it in `onFormSubmit`, and pass it as `onRequireAuth` to
  `<PartnershipPhotoUpload isLoggedIn={isLoggedIn} onRequireAuth={redirectToAuth} .../>`.

## Out of scope
- Persisting the actual selected photo bytes across the auth redirect (would need
  IndexedDB — files can exceed the 5 MB/photo cap, too large/risky for one cycle). The user
  re-adds the photo after signing in; the fix is making that path clear and lossless for
  everything else (text draft), not eliminating the one extra re-attach step.
- The seeker form (`PostSeekerListingForm.tsx`) — it has no photo upload today.
- The pre-existing `router.push('/auth?next=/aircraft/new')` hardcoded path (ignores
  `isEdit`) in `PostAircraftForm.tsx` — edit pages already require auth to load, so this
  branch is unreachable in edit mode; not touching it.
- `src/app/api/upload-*-photo/route.ts` auth checks themselves — kept as-is (a sane
  security boundary); this fix works around the check, not against it.

## Acceptance criteria
- Logged out, on `/aircraft/new`: dropping/pasting/browsing a photo does not hit the upload
  API (no 401 in the console/network) and instead redirects to `/auth?next=/aircraft/new`
  with the in-progress text draft intact (autosaved).
- Same behavior on `/partnerships/new` (`/auth?next=/partnerships/new`).
- Logged in: photo upload on both forms behaves exactly as before (no regression).
- The empty drop-zone and "add more" tile visibly indicate sign-in is required when logged
  out, rather than only failing after an attempt.
- `npx next build` + typecheck pass; QA smoke passes on `/aircraft/new` and
  `/partnerships/new` at desktop + mobile.
