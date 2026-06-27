# Spec — aircraft-post-deferred-gate

**UTC:** 2026-06-27T05:25:50Z  
**Pillar:** 2 — Frictionless signup / auth  
**Slug:** aircraft-post-deferred-gate

## Goal
Remove the page-level auth gate from `/aircraft/new` so anyone can see and fill the
"Sell Your Aircraft" form without an account. Gate auth at form submission (the server
action already does this). Ensure the LocalStorage draft survives the auth redirect so
nothing the user typed is lost.

## Scope
- `src/app/aircraft/new/page.tsx` — remove auth redirect; pass `isLoggedIn` bool to form
- `src/components/PostAircraftForm.tsx` — accept `isLoggedIn` prop; intercept submit for
  guests (force-save draft to localStorage → navigate to `/auth?next=/aircraft/new`
  without clearing the draft); show a small guest banner below the form header

## Acceptance criteria
1. A non-logged-in visitor to `/aircraft/new` sees the "Sell Your Aircraft" form — no
   redirect to `/auth`, no empty page, no error.
2. A guest can fill fields; the form autosaves to `ch:draft:aircraft-new` in localStorage
   (the existing `useFormDraft` mechanism is unchanged for logged-in users).
3. When a guest clicks "Post Aircraft for Sale," they navigate to `/auth?next=/aircraft/new`
   and their draft **is still in localStorage** (not cleared).
4. After signing in, the guest lands on `/aircraft/new` and sees their draft restored
   (the existing `useFormDraft` restore-on-mount handles this).
5. Logged-in users: no change in behaviour — submit still runs `createAircraftListing`
   and redirects to `/aircraft?posted=…` on success.
6. A small guest-only banner appears between the page header and the form body:
   "Sign in to publish — your progress saves automatically on this device."
7. `npx next build` exits 0 (no TypeScript errors). Smoke gate passes on
   `/aircraft/new` + `/aircraft` at desktop 1280 + mobile 375.

## Out of scope
- Deferred gate for `/partnerships/new` or `/partnerships/seeking/new` (next cycle)
- Photo upload for guests (the upload API is auth-gated; error is shown inline, acceptable)
- Any change to `src/app/auth/**` or `src/lib/supabase*.ts` (frozen)
- Changes to `useFormDraft.ts`
