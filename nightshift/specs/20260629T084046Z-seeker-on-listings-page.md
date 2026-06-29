# Spec: seeker-on-listings-page

**Timestamp:** 20260629T084046Z  
**Pillar:** Frictionless listing posting (Pillar 1)  
**Slug:** seeker-on-listings-page

## Goal
After a pilot posts a "seeking partnership" listing, they should be able to find and manage it on the `/listings` page — just like aircraft and partnership listings. Today seeker listings are silently missing from `/listings`, and the post-success banners for both partnerships and seekers lack the "View all my listings →" link that the aircraft banner already shows.

## Scope
Files expected to touch:
- `src/app/listings/page.tsx` — add `partnership_seekers` query + "Pilots seeking" section
- `src/app/partnerships/[id]/page.tsx` — add "View all my listings →" link to the `justPosted` banner
- `src/app/partnerships/seeking/[id]/page.tsx` — add "View all my listings →" link to the `justPosted` banner

No schema changes — `poster_id` already exists on `partnership_seekers` (set in `createSeekerListing`).

## Acceptance criteria
1. `/listings` shows a "Pilots seeking" section when the logged-in user has one or more active/pending `partnership_seekers` rows with their `poster_id`.
2. Each seeker row shows: status badge, title (or derived label), home airport, created-at date, and a "View →" link to `/partnerships/seeking/[id]`.
3. When there are no seeker listings, the section is absent (no empty state rendered for that section).
4. The partnership `?posted=1` success banner now includes a "View all my listings →" link to `/listings` (matching the aircraft banner).
5. The seeker `?posted=1` success banner now includes a "View all my listings →" link to `/listings` (matching the aircraft banner).
6. `npx next build` passes clean; no TypeScript errors.
7. `/listings`, `/partnerships/[some-id]`, and `/partnerships/seeking/[some-id]` all pass qa-smoke (HTTP 200, no console errors, no overflow at 1280 + 375).

## Out of scope
- Edit / deactivate / delete listing flows (separate, larger build).
- Adding seeker listings to the nav avatar menu or anywhere else — just `/listings`.
- Changing the aircraft banner (already has the link).
