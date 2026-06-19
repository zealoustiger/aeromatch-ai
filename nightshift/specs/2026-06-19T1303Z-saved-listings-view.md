# Spec — Saved listings view (favorites slice 2)

**UTC:** 2026-06-19T13:03Z
**Slug:** saved-listings-view
**Branch:** night/saved-listings-view

## Goal
Give logged-in users a single place to browse every listing they've hearted: a new
`/saved` ("My Saved Listings") page + a nav link, completing slice 2 of the
favorites feature (slice 1 shipped the heart button on Partnerships in the
2026-06-19T12:04Z cycle).

## Context
- Slice 1 added the additive `saved_listings (user_id, listing_id, listing_type)`
  table, the `toggleSavedListing` server action, and `SaveListingButton` hearts on
  Partnership cards + the `/partnerships/[id]` detail header. The heart persists to
  the DB, but there is **nowhere to browse the saved collection** — this cycle adds it.
- Only **partnership** listings are favoritable today (`listing_type='aircraft'` is
  schema-ready but no aircraft heart exists yet — that's blocked on the human-WIP
  `AircraftSaleCard.tsx`). So `/saved` shows partnerships only this slice.
- Mirror the existing `/searches` page (the saved-searches view) for layout, auth
  gate, header, and empty-state styling so the two "saved" surfaces feel consistent.

## Scope (files I expect to touch — keep it small)
- **New:** `src/app/saved/page.tsx` — server component, auth-gated, lists saved partnerships.
- **Edit:** `src/components/Nav.tsx` — add a logged-in "Saved" link (Heart icon) next to "My Searches" in both desktop and mobile menus.
- No DB changes (table already exists). No new server action (reuse `toggleSavedListing`,
  which already `revalidatePath('/saved')`). No changes to `AircraftSaleCard.tsx` or any
  scraper file.

## Acceptance criteria
1. `/saved` while logged out → redirects to `/auth?next=/saved` (no crash), same pattern as `/searches`.
2. `/saved` while logged in with ≥1 saved partnership → renders those partnerships as
   `PartnershipCard`s (reusing the existing card), each with a **filled** heart
   (`initialSaved=true`), ordered newest-saved first.
3. `/saved` while logged in with **no** saved listings → a friendly empty state that
   points the user to `/partnerships` to start hearting (mirrors the `/searches` empty state).
4. A "Saved" nav link (Heart icon) appears **only when logged in**, in both the desktop
   nav and the mobile menu, and highlights when the path is `/saved` — consistent with
   the existing "My Searches" link.
5. `npx next build` passes (compile + TypeScript).
6. No new console errors on `/saved` (logged-out redirect path) or `/partnerships`;
   no horizontal overflow at 375px on `/saved`'s rendered state.

## Out of scope
- Aircraft favorites / aircraft on the `/saved` page (blocked on `AircraftSaleCard.tsx` WIP).
- A combined Saved-listings + Saved-searches hub, tabs, or counts.
- Any change to the heart/toggle behavior, the DB schema, or auth.
- Email alerts / notifications on saved listings.
