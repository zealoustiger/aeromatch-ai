# seeker-owner-nudge

## Goal
Give a "pilot seeking a partnership" listing's owner the same "Improve your listing"
nudge that aircraft-for-sale and partnership listings already have, now that the
seeker trust checklist (`seekerTrust.ts` / `SeekerTrustBadge` checklist variant)
exists to drive it.

## Scope
- New `src/components/SeekerListingOwnerNudge.tsx` — mirrors
  `ListingOwnerNudge.tsx`/`AircraftListingOwnerNudge.tsx` exactly (same card
  markup/copy shape), driven by `evaluateSeekerTrust` from `src/lib/seekerTrust.ts`
  as the single source of truth for what's missing. `member_posted` stays
  non-actionable (intrinsic to being the poster), matching the other two nudges.
- `src/app/partnerships/seeking/[id]/page.tsx` — compute `isOwner` from the
  already-fetched `user` (line ~126, currently only used for the save-button
  state) compared against `s.poster_id`, same pattern as the aircraft detail
  page's `const isOwner = !!user && !!p.poster_id && user.id === p.poster_id`.
  Render `{isOwner && <SeekerListingOwnerNudge s={s} editHref={...} />}`
  immediately before `<SeekerTrustBadge s={s} variant="checklist" />`, matching
  the exact placement convention (nudge directly above the trust checklist) used
  on both the aircraft and partnership detail pages. Edit href:
  `/partnerships/seeking/${id}/edit` (the existing seeker edit route).

## Acceptance criteria
- Non-owners (anonymous or a different logged-in user) never see the nudge.
- The owner of a seeker listing missing signals (e.g. no budget, no experience)
  sees a card naming exactly the missing, actionable signals, linking to the
  edit page.
- A fully-complete seeker listing (all 4 signals met, or only `member_posted`
  unmet) renders nothing from the nudge — never nags a complete listing.
- No schema change; no change to `evaluateSeekerTrust`/`SEEKER_TRUST_SIGNALS`
  (reused as-is, not redefined).
- `npx next build` + `npx tsc --noEmit` clean.
- QA smoke passes on `/partnerships/seeking/[id]` at desktop 1280 + mobile 375.

## Out of scope
- Any change to the aircraft/partnership nudges or their trust modules.
- `/listing-quality` copy (still aircraft/partnership-only) — separate flagged
  follow-up, not this slice.
- Owner-view of contact bar / any other pillar-2 concern — untouched.
