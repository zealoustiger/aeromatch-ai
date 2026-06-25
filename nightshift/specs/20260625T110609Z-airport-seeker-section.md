# Spec: airport-seeker-section

**UTC:** 2026-06-25T110609Z
**Lane:** [want] — last 3 non-bug cycles: carbon-cub-curate [goal], message-notify-throttle [want], seeking-drive-time [want]. Not all 3 [want] → [want] owed.

## Goal
Add a "Pilots seeking a partnership at {ICAO}" section to every airport detail page so the page becomes a genuine two-sided community hub — both available shares AND pilots looking to join one are visible in the same place.

## Background
The airport detail page (`/airports/[icao]`) currently only shows co-ownership partnerships based at or near the airport. The `partnership_seekers` table already stores seekers with a `home_airport` field, and the `getSeekers` query helper is already wired to filter by airport ICAO. Rendering seekers here is a pure front-end addition: no schema change, no new server actions.

## Scope (files to touch)
- `src/app/airports/[icao]/page.tsx` — only file: add seeker query + section render

## Acceptance criteria
1. Airport pages that have ≥1 active seeker at that exact ICAO show a "Pilots seeking a partnership here" section, with up to 4 `SeekerCard` cards.
2. Below the cards: a "See all X seeking at {ICAO}" link to `/partnerships/seeking?airports={ICAO}` and a "Post a seeking listing" CTA.
3. If 0 seekers at this airport, the section is omitted entirely (no empty state renders — no thin content).
4. Section appears after the "Based at {ICAO}" partnerships section and before the "Within 50 miles" section (logical order: based here → seekers here → nearby).
5. Smoke: HTTP 200, zero app-origin console errors, zero horizontal overflow at desktop 1280 + mobile 375 on at least one airport with seekers and one without.
6. Build passes with no TypeScript errors.

## Out of scope
- FBO data, flight-club data, ratings
- Profile-based "pilots who fly out of here" (needs a profile base-airport — deferred)
- Any schema changes
- Pagination (up to 4 preview cards is the scope; link to full browse for "see all")
