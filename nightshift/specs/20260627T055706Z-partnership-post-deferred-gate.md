# Spec: partnership-post-deferred-gate

**UTC timestamp:** 20260627T055706Z
**Slug:** partnership-post-deferred-gate

## Goal
Apply the deferred-auth-gate pattern to `/partnerships/new` and `/partnerships/seeking/new` so any visitor can see, fill, and autosave both posting forms before being asked to sign in — auth is deferred to the publish moment.

## Pillar
Pillar 2 — frictionless signup/auth. Removes the hard auth wall from partnership posting: previously, submitting either form as a guest triggered a server-side redirect (losing context); now the gate is deferred to submit-time with a client-side force-save so the draft survives auth.

## Scope (files to touch)
- `src/app/partnerships/new/page.tsx` — make async, check user, pass `isLoggedIn={!!user}` to form
- `src/app/partnerships/seeking/new/page.tsx` — same
- `src/components/PostPartnershipForm.tsx` — accept `isLoggedIn` prop, add `forceSaveDraft`, add `onFormSubmit` intercept, guest banner, button label swap
- `src/components/PostSeekerListingForm.tsx` — same pattern

## Acceptance criteria
1. Visiting `/partnerships/new` without an account shows the full partnership form (no redirect) with a blue guest banner: "Sign in to publish — your progress saves automatically on this device."
2. Visiting `/partnerships/seeking/new` without an account shows the full seeker form the same way.
3. Submitting either form as a guest does NOT hit the server action — instead, the draft is force-saved to localStorage and the browser navigates to `/auth?next=<form-path>`.
4. After signing in and returning to the form URL, `useFormDraft` restores the saved draft (existing behavior from the hook — verified by code review).
5. Logged-in users: behavior is identical to before (no banner, no change to submit path).
6. Build passes (`npx next build` exit 0, no TypeScript errors); smoke gate passes (HTTP 200, zero app-console errors, zero overflow at 1280 + 375).

## Out of scope
- The "Continue with Google" OAuth (touches frozen `src/app/auth/**`)
- Applying the same pattern to the aircraft/new form (already done)
- Any changes to the server actions `createPartnership` / `createSeekerListing`
