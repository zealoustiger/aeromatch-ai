# profile-bio-edit

## Goal
Let a signed-in pilot edit their `display_name` / `bio` / `mission` from `/account`, so
their public profile (`/pilots/[id]`) shows more than just an avatar + base airport +
listings.

## Scope
- `src/app/actions.ts` — extend `updateProfile` to also upsert `display_name`, `bio`,
  `mission` (trim, cap length, blank → `null` so the existing fallback copy still works).
- `src/components/ProfileAirportsForm.tsx` — add Display name / Mission (one-line) / Bio
  fields to the existing form (same submit, same `updateProfile` action — one save).
- `src/app/account/page.tsx` — select `display_name, bio, mission` alongside the existing
  `avatar_config, home_airport, favorite_airports` query and pass them into the form;
  tighten the section copy to mention name/bio are now editable.

## Acceptance criteria
- `/account`'s "Your pilot profile" section has editable Display name (short, capped),
  Mission (one-line tagline, capped), and Bio (multi-line, capped) fields, prefilled from
  the signed-in user's current `profiles` row.
- Saving persists via the existing owner-scoped RLS upsert on `profiles` (same pattern as
  `home_airport` today) — no schema/migration change.
- `/pilots/[id]` (existing public profile page) reflects the saved `display_name` (replacing
  the "ClubHanger member" fallback) and `mission`/`bio` — verified end-to-end against a real
  test account created + deleted this cycle.
- Blank fields save as `null`, not empty strings, so `/pilots/[id]`'s existing
  `profile.display_name || 'ClubHanger member'` / `profile.mission || profile.bio` fallback
  logic is unaffected.
- `npx tsc --noEmit` and `next build` clean; QA smoke passes (HTTP 200, no console errors,
  no horizontal overflow) at desktop 1280 + mobile 375 on `/account` and `/pilots/[id]`.

## Out of scope
- `listing_reviews` UI (slice 3), admin verification wiring (slice 4).
- Avatar upload/photo (existing `AvatarPicker`/`AviatorAvatar` untouched).
- Linking `/pilots/[id]` from listing-detail "posted by" attribution.
