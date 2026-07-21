# partnership-owner-seeker-alert

## Goal
Let a partnership listing's owner subscribe, right on their own listing page, to be alerted the next time a pilot starts seeking a matching partnership — closing the demand→supply loop that `aircraft-owner-seeker-alert` (2026-07-20) already shipped for aircraft-for-sale listings, but which the partnerships listing page is still missing (named as the deferred "next slice" in that cycle's CHANGELOG entry, and re-surfaced as `[P1][goal]` in plan-pass batch #15).

## Scope
- `src/app/partnerships/[id]/page.tsx` — add an owner-only `AlertSignup` box (`noun="seeker"`, `source="owner_partnership_seeker"`) right after the existing `isOwner` block (`ListingOwnerNudge` + `MatchCountNudge`, ~line 932-944), gated on `isOwner && p.make`. `sourcePath` prefilled to `/partnerships/seeking?make=<p.make>&state=<p.state>` (state only when present) — the exact matchable shape `parseSourcePath`'s seeker branch (`alert-digest/route.ts`) already understands.
- No other files. Reuses the existing `AlertSignup` component and `subscribeToAlerts` action as-is (same pattern as the aircraft-listing sibling) — no new component, no schema change, no cron change.

## Acceptance criteria
- On `/partnerships/[id]` for a listing with a `make`, the signed-in owner sees a new "alert me about new seekers" box below the existing `MatchCountNudge`, prefilled to their own make (+state when set).
- A non-owner (or anonymous) visitor never sees this box — no change to their view of the page.
- Submitting the box creates a real, matchable seeker alert (`/partnerships/seeking?make=...` shape) and fires `alert_subscribed` with `source: "owner_partnership_seeker"`.
- `npx next build` + `npx tsc --noEmit` clean.
- QA smoke (`qa-smoke.mjs`) passes at desktop 1280 + mobile 375 on `/partnerships/[id]` — HTTP 200, zero app-origin console errors, zero horizontal overflow — for the anonymous-visitor view (no owner session available in the smoke harness; matches how `aircraft-owner-seeker-alert` QA'd the analogous page).
- Existing `isOwner` UI (`ListingOwnerNudge`, `MatchCountNudge`) unchanged.

## Out of scope
- Any change to the aircraft-listing owner-alert box (already shipped).
- Multi-airport / radius filtering for the owner's seeker alert (bare make+state, matching the sibling implementation).
- Wiring `source="owner_partnership_seeker"` into any admin/scoreboard attribution view.
