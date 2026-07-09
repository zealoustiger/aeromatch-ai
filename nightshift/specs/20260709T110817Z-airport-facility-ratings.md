# Airport FBO / flying-club ratings (v1)

## Goal
Let signed-in pilots rate the curated FBOs and flying clubs shown on `/airports/[icao]`
(1-5 stars), and show the honest aggregate — closing slice 2 ("ratings") of the
`[P1][want]` "Airport pages as community hubs" backlog item, the last open piece.

## Scope
- New additive table `airport_facility_ratings` in `supabase/schema.sql` (owner-scoped
  RLS, mirrors `saved_listings`'s exact pattern) — one row per (user, airport, facility),
  upsertable so a pilot can change their rating.
- `src/lib/facilityRatings.ts` — `getFacilityRatingSummaries()` (service-role aggregate
  read, mirrors `saveCounts.ts`'s `getSaveCounts`, honesty-gated at `MIN_RATINGS_TO_SHOW = 2`)
  and `getUserFacilityRatings()` (authed read of the signed-in viewer's own ratings).
- `rateFacility` server action in `src/app/actions.ts` — signed-in only, upserts one row,
  validates `rating` is an integer 1-5, revalidates the airport page.
- New client component `FacilityRatingWidget.tsx` — 5 clickable stars + the aggregate
  ("4.3 (12)" / "Be the first to rate" / nothing until ≥2 ratings), optimistic update,
  "Sign in to rate →" (`?next=`) for logged-out visitors.
- Wire the widget into the existing FBO/flying-club list on
  `src/app/airports/[icao]/page.tsx` (next to each facility name).
- Fires `track('facility_rated', {...})` on a successful submit.
- Gracefully self-suppresses (no error, no chip) wherever the table isn't migrated live
  yet — same fallback pattern as every other pending-migration feature in this codebase.

## Acceptance criteria
- `/airports/[icao]` (a curated hub, e.g. `kpao`) renders the FBO/flying-club section
  with a star widget per facility, no layout shift/overflow at 1280 or 375px.
- Signed-out: widget shows the aggregate (if ≥2 ratings) + a "Sign in to rate" link;
  no interactive stars, no error.
- Signed-in: clicking a star calls `rateFacility`, persists (or upserts on re-rate),
  and the UI reflects the new rating without a full reload.
- If `airport_facility_ratings` doesn't exist yet on the live DB (pending human
  migration), the page still renders normally — no console error, no broken UI, rating
  widget just shows nothing interactive fails soft.
- `npx next build` + `npx tsc --noEmit` clean; QA smoke passes at desktop 1280 + mobile
  375 with zero app-origin console errors.
- No fabricated ratings — aggregate only shows with ≥2 real submitted ratings.

## Out of scope
- Free-text review comments / moderation queue (numeric-only rating avoids the abuse
  surface that would require moderation — a legitimate v2 slice).
- Non-curated airports (only the same 9 hubs that already have FBO/flying-club data).
- Admin ratings dashboard.
