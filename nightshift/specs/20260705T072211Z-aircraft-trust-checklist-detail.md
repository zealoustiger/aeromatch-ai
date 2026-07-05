# aircraft-trust-checklist-detail

## Goal
Show the aircraft-for-sale trust/completeness checklist on the `/aircraft/listing/[id]`
detail page — the same canonical trust signals already shown as a compact chip on the
browse card and documented on `/listing-quality` — replacing a redundant, undocumented,
one-off "Listing info" panel that duplicated the same concept with a different (and
disagreeing) signal set.

## Why replace instead of add
The detail page already renders `ListingCompletenessPanel` ("Listing info", X/5) in the
same sidebar slot — a standalone component with its own 5 signals (real photos, price,
specs, registration, TTAF) that has NO connection to `aircraftTrust.ts`'s 4 canonical
trust signals (`complete_specs`/`maintenance_disclosed`/`transparent_price`/
`member_posted`) used everywhere else (browse-card chip, `/listing-quality`'s
documentation, the partnership detail page's checklist). Adding a second, different
"how complete is this listing" widget next to it would be confusing (two different
scores for the same underlying idea) — the honest fix is to replace it with the one
system that's already documented and consistent with the rest of the site, matching
how the partnership detail page does it. `ListingCompletenessPanel` has exactly one
usage site and no test file, so removing it is safe and leaves no dead references.

## Scope
- `src/components/AircraftTrustBadge.tsx` — add a `variant?: 'compact' | 'checklist'`
  prop (default `'compact'`, unchanged rendering), with a `'checklist'` rendering
  mirroring `TrustBadge`'s checklist variant exactly (same markup/classes/copy
  pattern, aircraft's own 4 signals + `/listing-quality` link).
- `src/app/aircraft/listing/[id]/page.tsx` — replace the `ListingCompletenessPanel`
  import/usage with `<AircraftTrustBadge p={p} variant="checklist" />` at the same
  sidebar spot (right before the contact CTA) — the equivalent position to where the
  partnership detail page renders its checklist.
- Delete `src/components/ListingCompletenessPanel.tsx` (orphaned after the swap).

## Acceptance criteria
- `/aircraft/listing/[id]` renders a "Listing trust" checklist panel (score X/4, each
  of the 4 real signals with met/unmet state) for every aircraft-for-sale listing,
  using the real `evaluateAircraftTrust` scoring already used by the browse-card
  chip — no fabricated data, and the score now agrees with the card's chip.
- The old "Listing info" (X/5) panel no longer renders anywhere.
- The existing compact chip on `AircraftSaleCard` is visually unchanged (still
  defaults to `variant="compact"`).
- The checklist links to `/listing-quality`, same as the partnership version.
- `npx next build` + typecheck pass (no dangling import of the deleted component).
- QA smoke passes on `/aircraft/listing/[id]` (a real seeded id) and `/aircraft`
  (browse card unaffected) at desktop 1280 + mobile 375: HTTP 200, zero app-origin
  console errors, zero horizontal overflow.
- Visual cycle — screenshots confirm the checklist renders cleanly in the layout
  with no overlap/overflow, at both viewports.

## Out of scope
- No owner-facing "Improve your listing" nudge for aircraft (partnerships has
  `ListingOwnerNudge`; aircraft doesn't) — a separate, larger feature, left for a
  future slice.
- No change to the trust scoring logic itself (`aircraftTrust.ts`) or its 4 signals.
- No seeker-listing trust checklist (seeker listings have no trust module at all
  today — a bigger, separate slice; noted as a follow-up).
