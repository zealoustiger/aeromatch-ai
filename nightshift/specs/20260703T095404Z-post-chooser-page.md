# post-chooser-page

## Goal
Give the nav's generic "Post a Listing" CTA a real landing page that lets a visitor pick
which of the 3 listing types to post, instead of silently hardlinking everyone into the
partnership form.

## Context
`Nav.tsx`'s "Post a Listing" (desktop) / "Post" (mobile) CTA links straight to
`/partnerships/new`. A visitor who wants to sell an aircraft or post a seeker listing only
discovers those options via `PostTypeTabs`, which is mounted *inside* the 3 form pages
themselves — after they've already landed on the wrong one. Flagged as a real remaining
gap in the `contact-phone-prefill` CHANGELOG entry (2026-07-03).

## Scope
- New route `src/app/post/page.tsx` — a lightweight chooser page with 3 cards (Sell an
  aircraft / Post a partnership / Seeking a partnership), each linking to its existing
  form route (`/aircraft/new`, `/partnerships/new`, `/partnerships/seeking/new`). Styled
  to match the existing `/tools` hub card list (rounded-2xl, icon chip, hover state).
- `src/components/Nav.tsx` — change both the desktop and mobile "Post a Listing"/"Post"
  CTA hrefs from `/partnerships/new` to `/post`.
- No change to `PostTypeTabs`, the 3 form pages, or any server action.
- Leave `src/app/about/page.tsx`'s "Post a Listing" CTA untouched — it sits under
  partnership-specific copy ("Post your partnership...") so linking straight to
  `/partnerships/new` there is intentional, not the same bug.

## Acceptance criteria
- `/post` renders 3 clear cards/links, one per listing type, each going to the correct
  existing form route.
- Nav's "Post a Listing" (desktop) and "Post" (mobile) CTAs both point to `/post`.
- `npx next build` + `tsc --noEmit` pass clean.
- `qa-smoke.mjs` passes on `/post` (and a quick regression check that the nav CTA now
  lands there) at desktop 1280 + mobile 375: HTTP 200, zero app-origin console errors,
  zero horizontal overflow.
- No change to the 3 existing form pages' behavior or content.

## Out of scope
- Any redesign of `PostTypeTabs` or the 3 forms themselves.
- The `/about` page's partnership-specific "Post a Listing" CTA.
- Any analytics/PostHog event wiring for the new page (can be a follow-up).
