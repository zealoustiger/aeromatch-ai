# account-page-seeker-parity

## Goal
Fix `/account` page's stale 2-way listing-type logic and copy so seeker ("pilot seeking a partnership") saved searches are labeled and mentioned correctly, matching the 3-way parity `/searches` already has.

## Scope
- `src/app/account/page.tsx`:
  - `marketplaceLabel()` (line 30-32): add the `/partnerships/seeking` → `'Pilot Seekers'` branch, matching `src/app/searches/page.tsx`'s already-correct 3-way version.
  - Logged-out explainer copy (line 90-95): "co-ownership partnerships and planes for sale" → mention all 3 listing types.
  - Logged-out "Just browsing?" footer (line 109-119): same 2-of-3 omission, add the seeker link.
  - "No saved searches yet" empty state (line 179-191): add a link to `/partnerships/seeking` alongside the existing `/aircraft`/`/partnerships` links, matching the pattern already used on `/saved` (`saved-empty-state-seeker-mention`, 2026-07-04).

## Acceptance criteria
- A saved search with `path === '/partnerships/seeking'` shows the badge "Pilot Seekers" on `/account`, not "Partnerships".
- Logged-out explainer copy on `/account` mentions all three listing types.
- The empty "No saved searches yet" state links to all three browse pages (aircraft, partnerships, seeker), not just two.
- `npx next build` + typecheck pass.
- No visual regression on `/account` at desktop 1280 / mobile 375 (this is a visual/copy cycle — screenshots reviewed).
- No schema/auth/logic change — pure copy + label fix, additive only.

## Out of scope
- No changes to `/searches`, `/saved`, or any other page.
- No changes to `saved_searches` schema or query logic.
- No changes to auth flow.
