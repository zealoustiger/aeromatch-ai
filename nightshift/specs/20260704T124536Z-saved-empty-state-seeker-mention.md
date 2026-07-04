# saved-empty-state-seeker-mention

## Goal
Make the `/saved` page's copy (empty state + "Looking for more?" footer, both the
logged-in server view and the logged-out device-save view) mention seeker listings,
closing a stale gap left when seeker save/heart support shipped (`seeker-save-heart`,
2026-07-04) but the surrounding copy was never updated.

## Scope
- `src/app/saved/page.tsx`: logged-in header subcopy ("Partnerships and aircraft
  you've hearted"), the `total === 0` empty state, and the "Looking for more?" footer.
- `src/components/DeviceSavedListings.tsx`: the `total === 0` empty state and the
  "Looking for more?" footer (logged-out / device-save view).
- Add a third link to `/partnerships/seeking` ("pilots seeking a partnership" /
  "seeking listings") alongside the existing `/partnerships` and `/aircraft` links
  in all four spots.

## Acceptance criteria
- Both empty states (`saved/page.tsx` total===0, `DeviceSavedListings.tsx` total===0)
  list all three browse surfaces: partnerships, aircraft for sale, and seeking listings.
- Both "Looking for more?" footers list all three links.
- The logged-in header subcopy in `saved/page.tsx` mentions all three listing kinds
  (or a neutral phrasing that doesn't imply only two).
- No change to any data-fetching, save/heart logic, or layout structure — copy/links only.
- `npx tsc --noEmit` and `npx next build` pass clean.
- QA smoke passes on `/saved` (desktop 1280 + mobile 375, logged-out so both the
  device-save empty state and the "Looking for more?" footer at the bottom are visible
  in the same render — no active saved listings expected in this environment).

## Out of scope
- Any change to the actual save/heart mechanics, hydration, or the seeker card itself.
- The optional per-save note feature (`SavedListingNote`) — untouched.
- Visual/layout redesign of `/saved` — text-only addition.
