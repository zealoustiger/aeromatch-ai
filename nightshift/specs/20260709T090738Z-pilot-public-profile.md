# Pilot public profile — slice 1 (view only)

## Goal
Give real signed-up pilots a public profile page (avatar, home airport, verified
badge, member-since, their active listings) — the first slice of BACKLOG.md's
`[P3][want] Pilot profiles + reviews/trust`, which today only exists for
hand-seeded demo personas (`/members/[id]`), not real users.

## Scope
- New `src/lib/publicProfile.ts`: `getPublicProfile(userId)` (reads the public-read
  `profiles` row) + `getPublicProfileListings(userId)` (active aircraft/partnership/
  seeker rows by `poster_id`, mirrors `src/app/listings/page.tsx`'s query shape).
- New route `src/app/pilots/[id]/page.tsx` — server component, `id` = `profiles.user_id`.
  - 404s when no `profiles` row exists for that id (nothing to show).
  - Header: `AviatorAvatar` (config), `display_name` (fallback "ClubHanger member"),
    verified badge (`ShieldCheck`) when `profiles.verified`, home airport, bio/mission
    if set, "Member since {date}" from `created_at`.
  - Sections: active aircraft-for-sale / partnerships / seeker listings, reusing
    `AircraftSaleCard` / `PartnershipCard` / `SeekerCard` (no comp/save-count wiring
    this slice — plain cards, matches how `/members/[id]` started before its later
    parity slice). Honest empty state when the profile has 0 active listings.
  - `robots: { index: false, follow: true }` (new, low-content page; not part of
    tonight's parked SEO work).
- Edit `src/app/account/page.tsx`: add a small "View my public profile →" link
  (only when signed in) to `/pilots/{user.id}`, so a pilot can find/share their own
  page — the one entry point this slice wires.

## Acceptance criteria
- `/pilots/[id]` renders for a user with a `profiles` row: avatar, home airport (if
  set), verified badge (if true), member-since, and their real active listings.
- `/pilots/[id]` 404s for a random/nonexistent id (no bare-empty page for every uuid).
- No email/phone or any field never disclosed as public is shown (only fields the
  `profiles` table already documents as `RLS: public read`, consistent with the
  existing `/airports/[icao]` "Pilots based here" precedent).
- `/account` shows a working link to the signed-in user's own `/pilots/[id]` page.
- `npx next build` + `npx tsc --noEmit` clean; QA smoke passes at desktop 1280 +
  mobile 375 on `/pilots/[id]` (a real seeded user, if one has a profile row) and
  `/account`.

## Out of scope
- Reviews (`listing_reviews`) — a later slice.
- Editing display_name/bio/mission (no UI exists for these fields yet; they'll
  simply be absent/omitted on the page until a future edit slice adds them).
- Admin verification UI.
- Linking to `/pilots/[id]` from listing detail "posted by" attribution — a natural
  next slice, not done here to keep this cycle's diff scoped.
