# Aircraft-for-sale owner "Improve your listing" nudge

## Goal
Port the partnership listing's owner-facing "Improve your listing" nudge
(`ListingOwnerNudge`) to the aircraft-for-sale detail page, so self-posted
aircraft sellers get the same actionable, trust-signal-driven prompt to
complete their listing that partnership posters already get.

## Scope
- New `src/components/AircraftListingOwnerNudge.tsx` — same shape as
  `ListingOwnerNudge.tsx` but imports `evaluateAircraftTrust`/
  `AircraftTrustSignal` from `src/lib/aircraftTrust.ts` instead of the
  partnership trust module, with its own `SIGNAL_ACTIONS` copy for the
  aircraft signal keys (`complete_specs`, `maintenance_disclosed`,
  `transparent_price`); `member_posted` excluded (intrinsic, not actionable).
- `src/app/aircraft/listing/[id]/page.tsx` — compute `isOwner = !!user &&
  user.id === p.poster_id` (reusing the `user` already fetched at line 546,
  no new query), and render `<AircraftListingOwnerNudge p={p} editHref={...}
  />` gated on `isOwner`, placed directly above the existing
  `<AircraftTrustBadge p={p} variant="checklist" />` (mirrors the partnership
  detail page's layout: nudge above checklist).
- Edit href: `/aircraft/listing/${p.id}/edit` (the existing edit route).

## Acceptance criteria
- Visiting `/aircraft/listing/[id]` as the listing's owner (signed-in user
  whose id === `p.poster_id`) with an incomplete listing (missing specs,
  maintenance hours, or price) shows the "Improve your listing" card listing
  only the missing, actionable items, with a working "Update your listing"
  link to the edit page.
- The same page, viewed as a non-owner (logged out or a different user),
  never renders the nudge.
- A fully-complete owner-posted listing (all 3 actionable signals met)
  renders nothing from the new component (no empty/nagging card).
- No new server query — ownership check reuses the `user` already fetched on
  the page.
- `npx next build` passes with no new type errors.
- QA smoke passes on `/aircraft/listing/[id]` at desktop 1280 + mobile 375,
  no new console errors, no horizontal overflow.

## Out of scope
- Any change to `evaluateAircraftTrust`'s signal definitions or scoring.
- Adding a `real_photo` signal (deliberately excluded, no image column — see
  `aircraftTrust.ts` comment).
- Ranking effects from trust score (still slice 1 — visibility only).
- Partnership or seeker listing pages (already have / don't yet have their
  own nudge parity — separate scope).
