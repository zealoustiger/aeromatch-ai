# nav-signin-homepage-next

## Goal
Fix "Sign in" from the homepage nav landing the user on `/searches` instead of back on `/`, by passing an explicit `next=/` instead of omitting the param.

## Scope
- `src/components/Nav.tsx` only:
  - `signInHref` (~line 44-45): currently `pathname !== '/' ? '/auth?next=...' : '/auth'` — change the homepage branch to `/auth?next=%2F` (or equivalent `encodeURIComponent('/')`).
  - `handleSignInClick` (~line 52-58): currently `full && full !== '/' ? '/auth?next=...' : '/auth'` — change the homepage branch to push `/auth?next=${encodeURIComponent('/')}` instead of bare `/auth`.
- No other files touched. `src/app/auth/**` is frozen and not edited — this only changes what Nav.tsx passes in, not the auth page's fallback logic.

## Acceptance criteria
- Clicking "Sign in" (desktop nav link and mobile menu link) while on `/` navigates to `/auth?next=%2F` (verify via rendered `href`/pushed URL), not bare `/auth`.
- Clicking "Sign in" while on any other page still preserves that page's full path + query string exactly as before (no regression to the non-homepage case).
- After completing sign-in from the homepage, the user returns to `/` (the auth page's existing `next` handling already redirects there once `next=/` is passed — no auth-file change needed).
- `npx next build` + typecheck pass.
- QA smoke passes on `/` (and one other page, e.g. `/partnerships`, to confirm the non-homepage case still works) at desktop 1280 + mobile 375, no console errors, no horizontal overflow.

## Out of scope
- Any change to `src/app/auth/**`, `src/app/auth/callback/route.ts`, or the `next` fallback default (`/searches`) — those are frozen/untouched.
- Any other sign-in entry point (already covered elsewhere; e.g. per-listing contact/save/message CTAs already pass their own `next`).
