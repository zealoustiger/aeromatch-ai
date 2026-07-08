# airport-pilots-based-here

## Goal
Show a real, honest "Pilots based at {ICAO}" section on the airport detail page
(`/airports/[icao]`), reading the base-airport field that pilots can now set on
`/account` (shipped this same night via `profile-base-favorite-airports`) — the
named prerequisite for the backlog's `[P1][want]` "Airport pages as community
hubs" slice 3.

## Scope
- `src/app/airports/[icao]/page.tsx`: add a `getPilotsBasedAt(icao)` helper
  (same local-helper convention already used in this file for `getAirport`/
  `getListings`) that reads `profiles` for rows whose `home_airport` matches this
  airport's ICAO (uppercased), OR'd with `favorite_airports` containing it via
  the same `.or('home_airport.eq.X,favorite_airports.cs.{X}')` pattern
  `seekersQuery.ts` already uses for `additional_airports` — with the identical
  graceful retry-without-that-column fallback if `favorite_airports` isn't
  migrated live yet (it isn't, per schema.sql's flagged HUMAN ACTION comment).
  `profiles` RLS is public-read, so the existing anon-key server client works
  unauthenticated.
- New section on the page: "Pilots based at {ICAO} ({count})" — a row of
  generated `AviatorAvatar` avatars (seeded by `user_id` + their saved
  `avatar_config`), capped at 12, **no name, no bio, no hours/ratings/mission
  shown**. Those columns (`display_name`, `bio`, `total_hours`, `ratings_held`,
  `mission`) are unused dead columns today (never written by any UI) and were
  never disclosed to a pilot as "will be shown on an unrelated public airport
  page" — showing only the anonymous avatar + a real count keeps this honest
  and low-risk while still being a genuine community signal. Include a small
  CTA below: "Based here too? Set it in your pilot profile →" linking `/account`.
- Self-suppress the entire section when the count is 0 (no thin/empty section
  — same convention as `CompPill`/the "Rare find" chip/etc.).
- `src/app/account/page.tsx`: tighten the "Your pilot profile" section's copy
  from the vague future-tense "This helps us show you as a pilot based near an
  airport in the future" to something concrete and honest now that this is
  live — e.g. "Shown as an anonymous avatar (no name) on that airport's page,
  so other pilots know you're around." Flagged by research as under-disclosing
  what actually happens; since I'm the cycle that makes the promise real, the
  copy should say so accurately.

## Acceptance criteria
- `/airports/[icao]` for an airport with ≥1 real profile whose `home_airport`
  matches shows a "Pilots based at {ICAO} (N)" section with N anonymous
  avatars; for an airport with 0 matching profiles, the section doesn't render
  at all (no empty state, no console error).
- Query works whether or not the `favorite_airports` column exists live (no
  server-side error either way — verified via reading code path, and directly
  against the live unmigrated DB during QA).
- No personally-identifying profile field (name/bio/hours/ratings/mission) is
  rendered in this section.
- `/account`'s pilot-profile copy accurately describes the now-live behavior.
- `npx next build` + `npx tsc --noEmit` clean; `qa-smoke` PASS on `/airports/*`
  and `/account` at 1280 + 375, zero app-console errors, zero overflow.

## Out of scope
- Showing pilots from *nearby* airports (50mi radius) — exact `home_airport`
  match only this slice, mirroring how partnerships' "Based at" vs "Nearby"
  split was itself sliced.
- A public per-pilot profile page / clickable avatars — none exists yet site-
  wide; this is a presence signal only, not a directory.
- A "Verified" badge — `profiles.verified` is admin-only and has no verification
  UI anywhere yet; not worth fabricating importance for an always-false field.
- Applying the `favorite_airports` migration live (still a human action item).
