# Profile: base + favorite airports

## Goal
Let a signed-in pilot set their base airport and up to 3 favorite/frequently-visited
airports from `/account`, laying the groundwork (BACKLOG.md's own explicit prerequisite)
for a future airport-page "pilots who fly out of here" section.

## Scope
- `supabase/schema.sql` — additive `alter table profiles add column if not exists
  favorite_airports text[]` (mirrors the existing `seeker_additional_airports` /
  `threads_aircraft_support` migration-comment pattern; flagged for human application).
  `profiles.home_airport` already exists and is unused today (confirmed via a live-DB
  read: every real profile row has `home_airport: null`) — no migration needed for it.
- `src/app/actions.ts` — new `updateProfile(formData)` server action: validates the base
  airport + each favorite airport against the real `airports` table (same "reject a
  fake/typo'd ICAO" pattern as `createPartnership`/`createSeekerListing`), dedupes and
  caps favorites at 3, drops a favorite that duplicates the base airport, and upserts
  into `profiles`. Retries the upsert without `favorite_airports` if that column isn't
  migrated yet (graceful fallback, same pattern as `additional_airports`).
- `src/app/account/page.tsx` — new "Your pilot profile" section (between the avatar
  picker and Email alerts) with a small form: base airport (reuses
  `AirportFormInput`) + up to 3 optional favorite-airport inputs, a Save button, and a
  brief note that this seeds a future "pilots based here" airport feature.
- Read the current profile's `home_airport`/`favorite_airports` in the existing
  `/account` profile query (already selects from `profiles` for `avatar_config`) to
  prefill the form; select-then-fallback if `favorite_airports` isn't migrated live yet.

## Acceptance criteria
- Signed-in `/account` shows a "Your pilot profile" section with a base-airport input
  (prefilled if already set) and up to 3 favorite-airport inputs.
- Submitting a valid ICAO for base and/or favorites persists to `profiles` and the page
  reflects the saved values after redirect/revalidate.
- Submitting a fake/typo'd ICAO shows a clear error, nothing is saved.
- Works today even though `favorite_airports` isn't migrated live yet (base airport
  saves; favorites are silently dropped via the fallback, no error to the user).
- No regression on the rest of `/account` (avatar picker, email alerts, activity grid,
  sign-out) or on any other page.
- `npx next build` + typecheck green; QA smoke clean on `/account` at desktop 1280 +
  mobile 375, zero console errors, zero overflow.

## Out of scope
- The airport-page "pilots who fly out of here" display itself (BACKLOG.md's own
  next slice, needs this prerequisite first).
- Ratings/ratings-verification, bio, mission, display_name editing (existing unused
  `profiles` columns) — not part of this ask.
- Applying the `favorite_airports` migration against live Supabase (flagged for a
  human, same as every other pending additive migration in this backlog).
