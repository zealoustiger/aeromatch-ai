# partnerships-hub-alert-signup

## Goal
Add the filter-aware, no-account "get alerts" email signup to the `/partnerships` hub — the one major browse page missing it, closing a real Pillar-2 (frictionless signup) inconsistency.

## Scope
- `src/app/partnerships/page.tsx` only:
  - Compute `alertContext` / `alertSourcePath` from the active `make`/`state`/`airport` query params, mirroring `/aircraft`'s `describeAircraftFilters` + preserved-query-string pattern (and `/partnerships/seeking`'s simpler make-only version).
  - Render `<AlertSignup context={alertContext} sourcePath={alertSourcePath} noun="partnership" />` after the listings/cross-sell block, before the "About aircraft partnerships" section — mirroring `/aircraft`'s placement relative to its listings.

## Why this is a genuine gap
`/aircraft`, `/partnerships/seeking`, `/partnerships/near/[icao]`, `/partnerships/make/[make]`, and `/partnerships/state/[state]` all already have a filter-aware `AlertSignup`. The flagship `/partnerships` hub only shows `PartnershipLaunchBanner` (a different, geo-IP-based component that ignores active filters). The backend already supports this exact shape: `alert-digest/route.ts`'s `parseSourcePath` parses `/partnerships?make=&state=&airport=` already. This is a missing UI wire-up, not a design decision.

## Acceptance criteria
- `/partnerships` (no filters) shows an `AlertSignup` box with general "get new-listing alerts" copy.
- `/partnerships?make=Cessna` shows an `AlertSignup` box whose copy references "Cessna" and whose form posts a `sourcePath` of `/partnerships?make=Cessna`.
- `PartnershipLaunchBanner` is untouched and still renders above the filters/listings as before.
- `npx tsc --noEmit` and `npx next build` both pass cleanly.
- QA smoke passes on `/partnerships` and `/partnerships?make=Cessna` (or another real make) at desktop 1280 + mobile 375: HTTP 200, zero app-origin console errors, zero horizontal overflow.
- Visually: the new alert box renders cleanly in the same slot `/aircraft`'s does, no overlap/overflow.

## Out of scope
- `PartnershipLaunchBanner`'s fabricated visitor-count copy (a separate, fuzzier honesty issue — not touched this cycle).
- `SeekerContactBar`'s owner-view empty-state bug (a separate candidate gap — not touched this cycle).
- Any change to `src/app/auth/**` or other frozen files.
