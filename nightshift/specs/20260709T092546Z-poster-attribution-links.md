# poster-attribution-links

## Goal
Link real, signed-up posters' listing-detail pages to their public `/pilots/[id]` profile, so a
buyer can see who they're dealing with and a poster's profile page becomes reachable from the
listings it's meant to showcase.

## Context
`/pilots/[id]` (shipped `pilot-public-profile`, 2026-07-09) and its edit UI (`profile-bio-edit`,
2026-07-09) are both live, but nothing on the site actually links to a pilot's profile from their
own listings yet — the last two CHANGELOG entries flagged this exact gap as the next slice of
`[P3][want] Pilot profiles + reviews/trust` (BACKLOG.md line ~1626).

## Scope
- `src/components/PosterAttribution.tsx` (new) — small server-renderable block: avatar
  (`AviatorAvatar`, real `avatar_config` or seeded fallback) + "Posted by {display_name ||
  'ClubHanger member'}" + home airport (if set), linking to `/pilots/{user_id}`.
- `src/app/aircraft/listing/[id]/page.tsx` — for real user-posted aircraft
  (`p.source === 'user' && p.poster_id`), fetch `getPublicProfile(p.poster_id)` and render
  `PosterAttribution` above the existing "Contact the seller" card. Self-suppresses (renders
  nothing) when the poster has no `profiles` row yet (never visited `/account`) — same guard
  `/pilots/[id]` itself uses, so we never link to a 404.
- `src/app/partnerships/[id]/page.tsx` — mirror, but ONLY for real posters, i.e. the
  `!seed` branch (seed/demo personas already get their own `/members/[id]` link + avatar in the
  `seed && persona` branch — untouched). Fetch `getPublicProfile(p.poster_id)` when `!seed &&
  p.poster_id`, render `PosterAttribution` above the existing contact-name/`ContactButtons` block.

## Deliberately out of scope
- **`/partnerships/seeking/[id]` (seeker listings) — NOT touched.** These are anonymized by
  design (`anonymizeName` → "First L.", shipped `anonymous-by-default-seeker-posts`, 2026-06-22)
  specifically so a pilot's identity isn't fully exposed. Linking to a full `/pilots/[id]` profile
  (real name, home airport, other listings) would defeat that anonymity, so this cycle leaves
  seeker listings as-is.
- No change to `/pilots/[id]` itself, no schema, no new query beyond the existing
  `getPublicProfile` (already used by `/pilots/[id]` and `/airports/[icao]`).
- `listing_reviews` UI (slice 3 of the same backlog item) — separate, larger slice; not this cycle.
- Admin verification wiring (slice 4) — touches admin surfaces; not this cycle.

## Acceptance criteria
1. A real user-posted aircraft-for-sale listing (poster has a `profiles` row) shows a "Posted by
   {name}" block linking to `/pilots/{poster_id}` above the contact card.
2. A real user-posted partnership listing (non-seed, poster has a `profiles` row) shows the same
   block above its contact card; seed/demo persona partnerships are unchanged (still link to
   `/members/[id]`).
3. When the poster has no `profiles` row, no attribution block renders (no dead link / 404) on
   either page — confirmed against a real listing whose poster hasn't visited `/account`.
4. Scraped aircraft listings (`source !== 'user'`) and seeker listings render exactly as before —
   no attribution block, no new query.
5. `next build` + typecheck clean; QA smoke passes desktop 1280 + mobile 375, zero new console
   errors, zero overflow.
6. No schema change, no FREEZE file touched.

## Out of scope
Everything under "Deliberately out of scope" above.
