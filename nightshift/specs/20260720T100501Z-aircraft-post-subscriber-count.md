# aircraft-post-subscriber-count

## Goal
Show the same honest "N subscribers with matching alerts will hear about this listing in
their next digest" line on the aircraft post-success screen (`/aircraft/listing/[id]?posted=1`)
that already ships on the partnership post-success screen — the flagged remaining follow-up
slice of BACKLOG.md's `[P1][goal]` "N matching subscribers will be notified" item.

## Scope
- `src/lib/alertSubscriberMatch.ts` — add an aircraft counterpart to the existing partnership
  reverse-match: `parseAircraftAlertSourcePath`, `matchesAircraftListing`, `AircraftListingFields`,
  `AircraftSubscriberTarget`. Covers the alert `source_path` shapes `AlertSignup` actually
  produces for aircraft: bare `/aircraft`, `/aircraft?make=&model=&state=&airport=&min_price=&
  max_price=&min_year=&max_year=&min_tt=&max_tt=`, `/aircraft/[make]`, `/aircraft/[make]/[model]`,
  `/aircraft/for-sale/[state]`, and the homepage `/` ("all" — matches every new aircraft/
  partnership listing site-wide, mirroring the digest cron's own `'all'` target and the existing
  partnership parser's identical `/` handling).
- `src/lib/alertMatchCounts.ts` — add `countMatchingAircraftSubscribers(listing)`, mirroring
  `countMatchingPartnershipSubscribers` (same query, same `LIVE_STATUSES`/self-check-email
  exclusion, same null-on-error honesty contract).
- `src/app/aircraft/listing/[id]/page.tsx` — compute `matchingSubscriberCount` only when
  `justPosted`, and render the same honest one-line sentence used on the partnership page,
  inside the existing `justPosted` confirmation block.
- `src/lib/alertSubscriberMatch.test.ts` — unit tests for the new aircraft parse/match functions.

## Out of scope
- `keyword` (`q`), `grades`, `avionics`, and `deal=good` filters on the bare `/aircraft?...`
  query-string shape are not matched this slice (same "not every dimension" precedent as the
  existing partnership matcher, which also doesn't cover every digest-cron field) — noted in a
  code comment.
- Curated `notModelPattern` exclusions for make/model combos (e.g. "172" vs "172RG") — the
  make/model path match uses the same `${modelSlug}%` prefix fallback the digest cron itself
  uses for uncurated combos, not the full curated SEO_MAKE_MODELS table (would require
  duplicating a large table into this zero-import-dependency module).
- `/aircraft/listing/[id]?watch=price` single-listing watch alerts — a brand-new listing can't
  already have a watcher, so these are irrelevant to this reverse-match and intentionally fall
  through to no match (same as the existing partnership watch-alert shape, which the partnership
  parser also doesn't special-case).
- No schema change, no new capture point, no FREEZE file touched.

## Acceptance criteria
- `npx next build` + typecheck pass.
- New unit tests pass: `node --experimental-strip-types --test src/lib/alertSubscriberMatch.test.ts`.
- `/aircraft/listing/[id]?posted=1` renders the subscriber-count line when ≥1 confirmed alert
  matches the just-posted listing's make/model/state/price/year/hours, and renders nothing at 0
  or on a query error (never a fabricated count).
- QA smoke passes (HTTP 200, no console errors, no horizontal overflow) at desktop 1280 + mobile
  375 on `/aircraft/listing/[id]` (the non-posted render path, since a real `posted=1` render
  requires a poster-owned listing) and `/aircraft` (regression check).
