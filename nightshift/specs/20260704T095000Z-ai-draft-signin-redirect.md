# ai-draft-signin-redirect

## Goal
When a logged-out visitor clicks "Prefill from your notes ✨" on any of the 3 post
forms, route them to sign in (draft + pasted notes intact) instead of showing a raw
"Not authenticated." error with no path forward.

## Scope
- `src/components/PostPartnershipForm.tsx` — `handleGenerate`: check `isLoggedIn`
  before calling the AI draft action; add `name` to the AI-notes textarea so its
  text is captured by the existing autosave/`forceSaveDraft` mechanism.
- `src/components/PostAircraftForm.tsx` — same treatment.
- `src/components/PostSeekerListingForm.tsx` — same treatment (inline redirect,
  matching its `onFormSubmit`'s existing inline pattern since this form has no
  standalone `redirectToAuth` helper).
- No changes to `src/app/actions.ts`, `src/app/auth/**`, or any frozen file.

## Acceptance criteria
- On all 3 post forms, clicking "Prefill from your notes ✨" while logged out
  saves the current draft (including the pasted notes, via the new `name` attr)
  and redirects to `/auth?next=<that form's own route>` — no server action is
  invoked and no "Not authenticated." error is shown.
- Logged-in behavior is unchanged (AI draft still runs and fills the form).
- After signing in and returning via `?next=`, the previously-typed notes text
  restores into the textarea along with the rest of the draft (uses the existing
  restore-on-mount path — no new restore logic).
- `npx next build` + typecheck pass.
- QA smoke passes (200 / no console errors / no horizontal overflow) on
  `/aircraft/new`, `/partnerships/new`, `/partnerships/seeking/new` at desktop
  1280 + mobile 375.

## Out of scope
- Making `checkAiDraftAccess` return a typed error instead of throwing.
- Any other auth-gated action not already flagged in this cycle's audit
  (messaging, save-search, saved-listing-note — all already confirmed correct).
- Editing any frozen file.
