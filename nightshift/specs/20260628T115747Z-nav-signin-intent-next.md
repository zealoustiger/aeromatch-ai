# nav-signin-intent-next

## Goal
The global "Sign in" button in the top nav preserves the user's current page via
`?next=`, so a logged-out visitor who signs in from anywhere returns to where they
were instead of being dumped on the homepage.

## Why (Pillar 2 — frictionless signup/auth)
Recent cycles wired `?next=` intent preservation into every *action* gate (contact,
save-listing, save-search) and every *page* gate (post forms, /listings, /searches,
/messages, /account). But the single most-clicked auth entry point — the persistent
"Sign in" link in the nav (desktop + mobile), present on every page — still points at
a bare `/auth`, so signing in from a browse page or a listing detail bounces the user
to the homepage default. This is the last broad intent-drop in the signup funnel.

## Scope
- `src/components/Nav.tsx` only. It is already `'use client'` and already calls
  `usePathname()`. Compute one `signInHref` and use it for both the desktop (line ~123)
  and mobile (line ~278) "Sign in" links.

## Acceptance criteria
- Clicking "Sign in" in the nav from any non-home page (e.g. `/aircraft`,
  `/partnerships`, a listing detail) navigates to `/auth?next=<that path>` (path
  URL-encoded).
- On the homepage (`/`), the link stays a bare `/auth` (no redundant `next=/`).
- Both the desktop and the mobile-menu "Sign in" links use the same logic.
- No `useSearchParams` is introduced (avoid forcing layout-level client-side
  rendering / CWV regression); only the pathname is preserved.
- `npx next build` + typecheck pass; QA smoke is clean (HTTP 200, no app console
  errors, no horizontal overflow) at 1280 + 375.

## Out of scope
- Preserving query-string filters across the redirect (would require
  `useSearchParams` in the layout-level nav — deferred for safety).
- Any change to the `/auth` page itself or the auth flow (frozen).
- Touching other sign-in CTAs (they already carry `?next=`).
