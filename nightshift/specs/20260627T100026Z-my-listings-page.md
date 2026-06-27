# Spec: my-listings-page

**Timestamp:** 2026-06-27T100026Z  
**Pillar:** Frictionless listing posting (Pillar 1) — post-publish experience

## Goal
Give sellers a "My Listings" page so they can find, review, and share their own posted aircraft and partnership listings after publishing. Currently there is no seller-facing listing-management surface; after posting, a seller has no way to navigate back to their listing except to search for it manually. This closes the posting feedback loop.

## Scope
- New page `src/app/listings/page.tsx` — server-rendered; queries `aircraft_for_sale` and `partnerships` by `poster_id = user.id`; redirects unauthenticated users to auth.
- `src/components/ProfileMenu.tsx` — add "My Listings" item (Plane icon, `/listings`) between "Messages" and "Saved".
- `src/components/Nav.tsx` — add "My Listings" link to the signed-in mobile menu (between Messages and My Searches).

## Acceptance criteria
1. Navigating to `/listings` while signed in shows two sections: "Aircraft for sale" and "Partnerships", each listing the user's own posted listings (queried by `poster_id`).
2. Each listing card shows: title, status badge (Active/Pending), price (or "Contact for price"), date posted, and a "View listing →" link to the appropriate detail page.
3. An empty state ("No listings yet — start by posting one") shows when the user has no posted listings, with links to all three post forms.
4. Navigating to `/listings` while logged out redirects to `/auth?next=/listings`.
5. "My Listings" appears in the profile dropdown (desktop) and the mobile menu.
6. `npx next build` exits 0 (zero TypeScript errors).
7. QA smoke: HTTP 200 on `/listings` (with logged-in session), zero app-origin console errors, zero horizontal overflow at 1280 + 375.

## Out of scope
- Listing editing (no edit route exists yet — that's a future slice).
- Deactivating/removing listings.
- Pending vs active listing counts in the nav badge.
