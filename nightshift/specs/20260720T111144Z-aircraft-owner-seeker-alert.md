# aircraft-owner-seeker-alert

## Goal
Give an aircraft-listing owner a persistent, prefilled way to subscribe to "tell me when a pilot starts looking for my aircraft" alerts on their own listing page — closing a demand→supply capture gap.

## Scope
- `src/app/aircraft/listing/[id]/page.tsx` — render an `<AlertSignup noun="seeker">` beside `AircraftListingOwnerNudge`, gated on the existing `isOwner` check.
  - `sourcePath`: `/partnerships/seeking?make={p.make}` (+ `&state={p.state}` when present) — matchable shape `parseSeekerAlertSourcePath` already understands.
  - `context`: `p.make` (+ model) so copy reads naturally, matching the pattern used elsewhere on this page.
  - `source`: `"owner_listing_seeker"` (new value, for scoreboard attribution — no scoreboard changes needed this cycle, just a distinguishable tag).
  - Only renders when `p.make` is set (mirrors how the buyer-facing `alertSourcePath`/crossSell blocks on this page already guard on `p.make`).
  - `noun="seeker"`, matches the exact prop convention already used in `/post/page.tsx`, `/partnerships/[id]/page.tsx`, `SeekerList.tsx`.

## Acceptance criteria
- On `/aircraft/listing/[id]` for a listing the signed-in visitor owns (and `p.make` is set), a new "Get alerts for new seekers" box renders near the existing "Improve your listing" nudge.
- The box is NOT shown to non-owners (existing `isOwner` gate) or when the listing has no `make`.
- Submitting a real email creates an `alerts` row with `source_path` matching `/partnerships/seeking?make=...` (and `state=...` when the listing has one) and fires `alert_subscribed` with `source: "owner_listing_seeker"`.
- `npx next build` + typecheck pass; QA smoke (desktop 1280 + mobile 375) passes with no new console errors and no horizontal overflow on `/aircraft/listing/[id]`.
- No schema change, no change to any other page.

## Out of scope
- Partnerships listing page owner-side seeker capture (the backlog item says "if it fits" — deferred to keep this cycle's diff to one page).
- Any scoreboard/`/admin/alerts` attribution rollup for the new `owner_listing_seeker` source value.
- matchCount / social-proof counts on the new box (kept minimal, matching the `/post/page.tsx` precedent which also omits them).
