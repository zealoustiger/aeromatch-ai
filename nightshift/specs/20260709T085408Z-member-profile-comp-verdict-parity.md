# member-profile-comp-verdict-parity

## Goal
`/members/[id]` renders a persona's partnership listing(s) via bare `PartnershipCard`
with no comp/deal-verdict/save-count props — the one remaining surface in Pillar 3's
comp-verdict rollout without parity (flagged as "Next" in the `airport-hub-comp-verdicts`
CHANGELOG entry, 2026-07-05). Wire in the same batched, honesty-gated signals every other
`PartnershipCard` call site already gets.

## Scope
- `src/app/members/[id]/page.tsx` only.
- Reuse existing helpers exactly as used elsewhere (`getPartnershipCompVerdicts` from
  `@/lib/partnershipComps`, `getSaveCounts` from `@/lib/saveCounts`) — same pattern as
  `src/app/partnerships/near/[icao]/page.tsx` and `src/app/saved/page.tsx`.
- No schema change, no new component, no new query shape — batch-fetch once for the
  page's `listings` array, pass `comp`/`dealVerdict`/`saveCount` into each `PartnershipCard`.

## Acceptance criteria
- `/members/[id]` for a seed persona (e.g. an id from `partnership_seekers`-adjacent
  seed data) renders without new console errors, HTTP 200.
- The page fetches comp verdicts + save counts for its own `listings` array via the
  same helpers other pages use (verified by code read, not a new bespoke query).
- `PartnershipCard` on this page receives `comp`, `dealVerdict`, `saveCount` props,
  matching the shape/behavior of `/partnerships/near/[icao]`.
- Fails soft: if verdicts/counts come back empty (dormant seed data, as noted in prior
  cycles), the page renders exactly as it does today — no crash, no empty-chip regression.
- No change to `/members/[id]`'s noindex/robots behavior, header, or messaging flow.
- `npx tsc --noEmit` and `npx next build` stay clean.

## Out of scope
- Any other page's comp-verdict wiring (all other surfaces already have parity).
- Aircraft-for-sale or seeker verdict parity (this page only ever shows partnership cards).
- Visual/design changes to `PartnershipCard` itself.
