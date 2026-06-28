# nav-signin-filter-intent

## Goal
Make the global-nav "Sign in" link preserve a logged-out visitor's **full current
URL — including active query-string filters** — across the auth round trip, so a
shopper mid-filter returns to their exact filtered view instead of the bare
pathname (Pillar 2 — frictionless signup/auth: intent preserved across the redirect).

## Context
`nav-signin-intent-next` wired the nav Sign-in button to preserve the current
**pathname** via `?next=`, but explicitly left query-string filters out of scope
because doing it with `useSearchParams` would force this layout-level nav (and
therefore every page) into client/dynamic rendering and risk a CWV regression.
The `Nav` component is already `'use client'`, so we can read `window.location`
**at click time** — capturing the live path + search — without `useSearchParams`,
closing that gap with no rendering-mode change.

## Scope
- `src/components/Nav.tsx` only.
  - Add a `handleSignInClick` handler that, on a plain left-click, prevents the
    default navigation, closes the mobile menu, reads
    `window.location.pathname + window.location.search`, and `router.push`es to
    `/auth?next=<encoded full URL>` (or `/auth` on the homepage).
  - Wire it as `onClick` on both the desktop and mobile "Sign in" `Link`s, keeping
    `href={signInHref}` (pathname-only) as the SSR / no-JS / new-tab fallback.
  - Let modified clicks (cmd/ctrl/shift/alt) fall through to the native href.

## Acceptance criteria
- Logged-out, on `/aircraft?make=Cessna` (or any filtered browse URL), clicking the
  nav "Sign in" navigates to `/auth?next=%2Faircraft%3Fmake%3DCessna` (filters kept).
- On a page with no query string (e.g. `/partnerships`), behaviour is unchanged:
  `next` is just the pathname.
- On the homepage `/`, "Sign in" still goes to bare `/auth` (no `next`).
- Cmd/Ctrl-clicking "Sign in" still opens the pathname-only fallback href (new tab).
- No `useSearchParams` is introduced; the nav/layout rendering mode is unchanged
  (no new console errors, no CWV regression, no horizontal overflow at 1280/375).

## Out of scope
- The auth page itself (`src/app/auth/**` is frozen) — no change to the form/headline.
- Any other sign-in entry point (post forms, contact, save flows already preserve intent).
- Preserving non-URL state (scroll position, transient UI).
