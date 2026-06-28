# save-search-intent-restore

**Pillar:** 2 — Frictionless signup / auth (defer the gate + preserve intent across auth).

## Goal
When a logged-out visitor clicks "Save this search", the save should **complete
automatically** after they sign in — instead of silently dropping the intent and
making them find and click "Save this search" a second time.

## Problem (today)
`SaveSearchButton` redirects a logged-out user to `/auth?next=<basePath>?<filters>`
(line 47-49). After sign-in they land back on the filtered browse page, but the
save-search intent is **lost** — they must re-click "Save this search". The
message buttons already solved the analogous gap with the `?contact=1` marker that
auto-opens the thread on return (`contact-intent-restore`); save-search has no
equivalent.

## Scope (one file)
- `src/components/SaveSearchButton.tsx` only.
  - Append a `saveSearch=1` intent marker to the `next=` URL when redirecting a
    logged-out user to auth.
  - On mount, if the user is now authenticated AND the marker is present, run the
    save once (guarded by a `useRef`), strip the marker from the URL via
    `window.history.replaceState`, and show the existing "Search saved"
    confirmation — mirroring the `?contact=1` auto-trigger idiom in `ContactBar`.
  - Compute the saved query from filters **minus** the marker so `saveSearch=1`
    never becomes part of the stored search / auto-name.

## Acceptance criteria
- Logged-out → click "Save this search" → redirected to `/auth?next=…&saveSearch=1`.
- After sign-in, returning to the filtered page **auto-saves** the search (no second
  click) and shows the "Search saved · View in Saved Searches" confirmation.
- The auto-save fires **at most once** per return (ref-guarded); a page reload does
  not re-fire it (marker stripped from the URL).
- The stored search query and its auto-generated name do **not** contain the
  `saveSearch` marker.
- Logged-in direct save behaves exactly as before (no regression); the button still
  self-suppresses when there are no active filters.
- `next build` + typecheck pass; QA smoke (HTTP 200 / no app console errors / no
  horizontal overflow) passes at 1280 + 375 on `/aircraft`, `/partnerships`,
  `/partnerships/seeking`.

## Out of scope
- No changes to `src/app/auth/**`, the auth callback, or `saveSearch` server action.
- No new UI, copy redesign, or naming step.
- Contact / save-listing flows (already shipped) are untouched.
