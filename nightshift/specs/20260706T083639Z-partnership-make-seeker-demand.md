# partnership-make-seeker-demand

## Goal
Show a real, honest count of pilots actively seeking a partnership in a given make on
`/partnerships/make/[make]` hub pages, to motivate owners of that make to post their listing.

## Scope
- `src/app/partnerships/make/[make]/page.tsx` — call the existing `getSeekers({ make: entry.filter })`
  helper (`src/lib/seekersQuery.ts`, already used elsewhere for the same array-overlap match) and
  render an honest count line near the existing "Have a {Make} to share? Post a free listing" CTA:
  e.g. "3 pilots are looking for a Cessna partnership right now" (singular-safe at 1).
- No new query/helper file — reuse `getSeekers` exactly as `/airports/[icao]` and the owner-only
  `MatchCountNudge` already do.
- No schema change.

## Acceptance criteria
- [ ] `/partnerships/make/cessna` renders a real, non-fabricated seeker-demand line (live DB has
      5 active Cessna seekers today) with a link to `/partnerships/seeking?make=Cessna`.
- [ ] Singular/plural copy is correct ("1 pilot is" vs "N pilots are").
- [ ] A make with 0 matching seekers renders nothing extra (no dead/fabricated copy) — verify via
      a make known to have 0 (e.g. Beechcraft, per live DB check).
- [ ] `npx next build` + typecheck pass.
- [ ] QA smoke (`qa-smoke.mjs`) passes on `/partnerships/make/cessna` and `/partnerships/make/beechcraft`
      at desktop 1280 + mobile 375 — HTTP 200, no console errors, no horizontal overflow.
- [ ] Screenshots look correct (visual cycle — new on-page copy).

## Out of scope
- Airport-page-scoped demand counts (the airport page already shows a plain seeker count — this
  slice is the make-specific "near you" framing called out in the backlog item; airport pages are
  a separate, already-partially-covered surface).
- The partnership *browse* page or detail page — this slice targets only the make hub family.
- Any change to seeker matching logic itself (`isCompatibleMatch`, `MatchCountNudge`) — those stay
  as-is; this is a public-facing (not owner-only) social-proof line.
