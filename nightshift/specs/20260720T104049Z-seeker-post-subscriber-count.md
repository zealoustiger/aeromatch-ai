# Seeker slice of the post-success subscriber count — complete the trilogy

## Goal
After a pilot publishes a "seeking a partnership" listing, show them the same honest
"N subscribers with matching alerts will hear about your search" line that the
partnership and aircraft post-success screens already got — the third and final leg
of the same feature.

## Scope
- `src/lib/alertSubscriberMatch.ts` — add `parseSeekerAlertSourcePath` +
  `matchesSeekerListing` (+ `SeekerSubscriberTarget`/`SeekerListingFields` types),
  mirroring the existing partnership/aircraft reverse-matchers in the same file.
- `src/lib/alertSubscriberMatch.test.ts` — unit tests for the new functions.
- `src/lib/alertMatchCounts.ts` — add `countMatchingSeekerSubscribers(listing)`,
  mirroring `countMatchingPartnershipSubscribers`/`countMatchingAircraftSubscribers`.
- `src/app/partnerships/seeking/[id]/page.tsx` — compute the count when
  `justPosted` and render the honest line in the existing post-success block.

## Semantics (mirrors the real alert-digest cron exactly)
- Only `seeker`-typed alerts count (`/partnerships/seeking` bare or with a
  `make`/`model`/`state`/`airport` query string) — a bare `/` ("all") alert does
  **not** count, because the live cron's own `countNew`/`'all'` branch sums
  aircraft + partnerships only, never seekers (`route.ts`'s `countNew`). This is
  the one place this reverse-matcher intentionally diverges from the
  partnership/aircraft parsers (which both treat `/` as "all, always counts").
- `make`: case-insensitive membership in the listing's `preferred_makes` array
  (mirrors the cron's `.overlaps('preferred_makes', [target.make])`).
- `model`: case-insensitive token match against the listing's free-text
  `preferred_models`, reusing `matchesModelFilter` (`seekerModelFilter.ts`) — the
  exact helper the cron/browse page already use.
- `state`: exact.
- `icao`: matches the listing's `home_airport` OR `additional_airports` array
  (mirrors the cron's `.or(home_airport.eq…, additional_airports.ov…)`); no
  radius (the cron's seeker target has no radius field either).

## Acceptance criteria
- `npx tsc --noEmit` and `npx next build` both exit 0.
- New unit tests pass (`node --experimental-strip-types --test src/lib/alertSubscriberMatch.test.ts`).
- On `/partnerships/seeking/[id]?posted=1`, when the real subscriber count is ≥1,
  a line renders naming the count; renders nothing at 0 or on a query error
  (never a fabricated number — same honesty gate as the other two post-success
  lines).
- No new capture point, no schema change, no FREEZE file touched.
- QA smoke passes on `/partnerships/seeking/[id]` (and a baseline touch of
  `/partnerships/seeking`) at desktop 1280 + mobile 375.

## Out of scope
- `additional_airports` radius expansion for seekers (the cron itself doesn't do
  this for seeker targets — bare ICAO match only).
- Any change to the digest cron itself.
