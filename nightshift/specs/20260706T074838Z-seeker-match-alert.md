# seeker-match-alert

## Goal
Let a seeker-listing owner set an email alert for new partnerships matching their own
posted criteria, directly on `/partnerships/seeking/[id]` — closing the "enable alerts
for new matches" half of the open `[P1][want]` backlog item "Instant payoff when
posting a seeking" (the other half, showing currently-matching partnerships, already
shipped via `getMatchingPartnerships`/`MatchCountNudge`).

## Scope
- `src/app/partnerships/seeking/[id]/page.tsx` only.
- Reuse the existing `AlertSignup` component (no new component) and the existing
  `alert-digest` `parseSourcePath` partnership-query-string shape (`/partnerships?make=&airport=`)
  that every other partnership surface already produces — purely a UI wire-up, matching
  the pattern in `src/app/partnerships/page.tsx` (`alertMake`/`alertAirport`/`alertContext`/
  `alertSourcePath`).
- Owner-only (same gating convention as `MatchCountNudge`/`SeekerListingOwnerNudge`) —
  a seeker's own alert preference isn't something other visitors should set on their behalf.
- Render regardless of whether `matches.length > 0`, so a seeker with zero current
  matches still gets an "we'll tell you when one appears" path (not a dead end).

## Acceptance criteria
1. The owner viewing their own seeker listing sees a "Get alerts for new {make}
   partnerships near {icao}" (or a sensible fallback copy when make/airport is
   missing) `AlertSignup` box.
2. A non-owner (or logged-out) visitor viewing the same seeker listing does NOT see
   this alert box.
3. The box renders identically whether or not the "Partnerships near {icao}" matches
   section above it has any results (i.e. not gated on `matches.length`).
4. Submitting a valid email calls the existing `subscribeToAlerts` action (via
   `AlertSignup`) with a `sourcePath` of the form `/partnerships?make=...&airport=...`
   (only the params that have a value) — confirmed this string round-trips through
   `alert-digest`'s existing `parseSourcePath` into a `{type:'partnership', make, icao}`
   target (code-read verification, no live send needed since Resend is a no-op gate).
5. No schema/action/component change — `AlertSignup`, `actions.ts`, and the `alerts`
   table are untouched.
6. `npx tsc --noEmit` and `npx next build` both pass; QA smoke passes on
   `/partnerships/seeking/[id]` (desktop 1280 + mobile 375, HTTP 200, zero app-origin
   console errors, zero horizontal overflow).

## Out of scope
- Multi-make or budget-aware alert matching (only the single `preferred_makes[0]` is
  used, mirroring `MatchCountNudge`'s existing href pattern one section above it).
- Any change to `alert-digest`'s matching logic, the `alerts` table, or `AlertSignup`.
- The seeker page's other open backlog remainders (state pages, airport hubs, etc).
