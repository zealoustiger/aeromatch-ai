# Spec — Save / Favorite listings (Partnerships, slice 1)

**UTC:** 2026-06-19T12:04Z
**Slug:** partnership-favorites
**Backlog item:** [P2] Save / favorite listings — "Heart button on cards + detail pages … Logged-out click → registration gate, then saves to the user's account. New `saved_listings` table; a 'Saved' view." This is the long-recurring recommended next pick (see CHANGELOG 09:02Z / 10:03Z / 11:06Z), done on the **clean partnership files** to avoid the human-WIP `AircraftSaleCard.tsx`.

## Goal
Add a working **heart / favorite** toggle to Partnership cards and the partnership detail page: logged-out click opens the registration gate; logged-in click persists to a new `saved_listings` table and the heart shows filled.

## Scope (small)
- **DB (additive only):** new `saved_listings` table mirroring the `saved_searches` RLS pattern (`create table if not exists`, owner-only RLS, index on `user_id`). Keep `supabase/schema.sql` in sync.
- `src/app/actions.ts` — add `toggleSavedListing(listingId, listingType)` server action (insert if absent / delete if present; owner-scoped).
- `src/components/SaveListingButton.tsx` — new client component (heart). Two variants: `icon` (cards) and `full` (label, detail page).
- `src/components/PartnershipCard.tsx` — render the heart; accept a `saved` prop.
- `src/components/PartnershipList.tsx` — fetch the current user's saved partnership ids in one query and pass `saved` per card.
- `src/app/partnerships/[id]/page.tsx` — fetch saved-state for this listing and render the heart in the header.

## Acceptance criteria
1. `npx next build` passes (compile + TypeScript) with zero new errors.
2. A heart control renders on every Partnership card and on the partnership detail page header, in the sky-blue accent, with no layout overflow at 375px.
3. **Logged-out**, clicking the heart redirects to `/auth?next=<the current path>` (the registration gate), without writing to the DB.
4. The `saved_listings` migration is applied additively (`create table if not exists`, owner-only RLS) — no existing table/row is altered or deleted; `supabase/schema.sql` reflects it.
5. Logged-in toggle logic is correct (insert→saved, second click→removed, idempotent unique constraint) — verified at build + data-layer + a deterministic logic check (a headless login isn't possible here, same precedent as the saved-searches cycle).
6. No new console errors on `/partnerships` or a `/partnerships/[id]` page vs. the pre-existing baseline.

## Out of scope (defer to later slices)
- The `/saved` ("My saved listings") view + any nav link — slice 2.
- Hearts on **aircraft** cards / `AircraftSaleCard.tsx` (human WIP) and the seeker listings.
- Auto-saving the clicked listing after a logged-out user completes signup (the listing isn't in the URL; gate is conversion-only for now).
- Email alerts / any notification behavior.
