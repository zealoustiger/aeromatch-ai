# seeker-trust-checklist-detail

## Goal
Add the expanded "Listing trust" checklist variant to the seeker detail page
(`/partnerships/seeking/[id]`), mirroring the checklist already shown on the
aircraft-for-sale and partnership detail pages.

## Scope
- `src/components/SeekerTrustBadge.tsx` — add a `variant?: 'compact' | 'checklist'`
  prop (default `'compact'`), mirroring `AircraftTrustBadge`/`TrustBadge` exactly
  (same layout, same "What do these mean? →" link to `/listing-quality`).
- `src/app/partnerships/seeking/[id]/page.tsx` — render
  `<SeekerTrustBadge s={s} variant="checklist" />` in the sidebar, immediately
  above `SeekerContactBar` (same relative placement as the aircraft/partnership
  pages: nudge/panels → trust checklist → contact card).
- No changes to `src/lib/seekerTrust.ts` (signal logic already correct/tested)
  or `SeekerCard.tsx` (compact chip usage unchanged, still calls with no
  `variant`, so it keeps defaulting to `'compact'`).

## Acceptance criteria
- `SeekerTrustBadge` renders the existing compact chip when called with no
  `variant` prop (default), unchanged from today — `SeekerCard`'s usage is
  visually identical to before.
- `SeekerTrustBadge` renders a checklist card (title "Listing trust", score
  pill, 4 signal rows with met/unmet icon + label + hint, "What do these
  mean? →" link) when called with `variant="checklist"`.
- The seeker detail page shows this checklist in the sidebar, above the
  contact card, for every seeker listing (score is always a real 0–4 count,
  never fabricated).
- `npx next build` + typecheck pass with no new errors.
- QA smoke passes (HTTP 200, no console errors, no horizontal overflow) on
  `/partnerships/seeking/[id]` at desktop 1280 + mobile 375.
- No regression to `/partnerships/seeking` or `/saved` (SeekerCard's compact
  chip usage).

## Out of scope
- An owner-facing "improve your profile" nudge for seekers (a separate,
  larger follow-on slice — needs an owner-ship/edit-href pattern like
  `ListingOwnerNudge`/`AircraftListingOwnerNudge`).
- Any change to the underlying trust signals themselves.
