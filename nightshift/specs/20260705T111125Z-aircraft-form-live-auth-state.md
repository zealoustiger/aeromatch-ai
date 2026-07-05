# aircraft-form-live-auth-state

## Goal
Give `PostAircraftForm` a live, client-side auth state (mirroring `Nav.tsx`'s
`getUser()` + `onAuthStateChange` pattern) instead of a static SSR-derived
`isLoggedIn` prop, so a session that expires/changes while the form is open
no longer silently disables the submit / AI-draft / photo-upload auth gates.

## Background
Flagged in `aircraft-edit-redirect-fix` (2026-07-05, CHANGELOG) and repeated
in BACKLOG.md Pillar 2: all 3 post/edit forms take `isLoggedIn` as a static
prop computed once at SSR. If a session expires mid-edit, the stale
`isLoggedIn=true` means `onFormSubmit`, `handleGenerate` (AI draft), and the
photo-uploader's auth gate never fire their redirect — the user just gets a
raw 401 error instead of being sent to `/auth?next=...` with their draft
intact. This is a real, live intent-drop gap in the signup/auth pillar
(GOAL.md: "a deferred signup gate must still capture the user at the value
moment").

Slicing per RUNBOOK ("slice big items — one shippable increment per cycle"):
this cycle ships the pattern on `PostAircraftForm.tsx` only (the aircraft
post/edit form). `PostPartnershipForm.tsx` and `PostSeekerListingForm.tsx`
get the identical treatment in a future cycle — noted in CHANGELOG `Next`.

## Scope
- `src/components/PostAircraftForm.tsx` only:
  - Rename the incoming prop to `isLoggedIn: isLoggedInProp = true` and add
    local state `const [isLoggedIn, setIsLoggedIn] = useState(isLoggedInProp)`
    so every existing internal usage of `isLoggedIn` (submit gate, AI-draft
    gate, photo-upload gate, banner) keeps working unchanged.
  - Add a `useEffect` that calls `createClient().auth.getUser()` once on
    mount and subscribes to `onAuthStateChange`, updating `isLoggedIn` live —
    same two calls `Nav.tsx` already makes, imported the same way
    (`@/lib/supabase`, not a `src/app/auth/**` or FREEZE file).
  - Unsubscribe on unmount.

## Out of scope
- `PostPartnershipForm.tsx`, `PostSeekerListingForm.tsx` (same gap, future
  slices).
- Any change to `src/app/auth/**`, `src/lib/supabase.ts`/`supabase-server.ts`
  (FREEZE) — only importing the existing exported `createClient()`.
- No new UI, no new copy, no schema/DB change.

## Acceptance criteria
- `npx next build` + typecheck pass clean.
- `/aircraft/new` and an aircraft `/edit` page still render, submit, and
  redirect-to-auth-when-logged-out exactly as before (no behavior change
  when the session is stable for the life of the form — this only fixes the
  stale-session case).
- No new console errors on either page at desktop 1280 / mobile 375.
- No horizontal overflow introduced (pure logic change, no layout touched).
- Confirm via code/manual check that a session change (e.g. sign out in
  another tab) flips `isLoggedIn` to `false` live without a page reload.
