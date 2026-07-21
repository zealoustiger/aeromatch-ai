# Spec: One-tap "near my home field" refinement on signed-in partnership/seeker alert capture

## Goal
Let a signed-in visitor with a saved `home_airport` narrow a location-less
partnership/seeker `AlertSignup` box to just their home field with one optional,
unchecked checkbox — instead of always getting the whole-country alert even
though we already know their field.

## Scope
- `src/components/AlertSignup.tsx` only:
  - Fetch the signed-in user's `profiles.home_airport` alongside the existing
    client-side `auth.getUser()` / `onAuthStateChange` signed-in-email check
    (same pattern `Nav.tsx` already uses for `avatar_config`).
  - Add a `withAirport()` helper (mirrors the existing `withDealOnly()`) that
    layers `airport=<ICAO>` onto the source_path's query string.
  - Show an unchecked "Only alert me near {ICAO} (my home airport)" checkbox,
    gated to render **only** when: signed-in, `home_airport` is set, `noun` is
    `partnership` or `seeker`, not `watchOnly`, the box isn't already
    airport/airports-scoped, **and** the bare path (before `?`) is exactly
    `/partnerships` or `/partnerships/seeking` — the two shapes
    `alert-digest`'s `parseSourcePath` actually reads a query string for on
    partnership/seeker targets. Path-segment SEO routes (`/partnerships/near/[icao]`,
    `/partnerships/make/[make]`, `/partnerships/state/[state]`, single-listing
    `?watch=price` boxes) never read query params for these types today, so
    showing the chip there would produce a checked box that silently does
    nothing — that's exactly the "confident but wrong" behavior GOAL.md's
    honesty bar forbids, so those surfaces are excluded.
  - Wire the checked state into `handleSignedInSubmit`'s `effectiveSourcePath`
    and the `alert_subscribed` track payload (`near_home_airport: true` when
    checked).

## Acceptance criteria
- On `/partnerships` and `/partnerships/seeking` (no existing `airport`/`airports`
  param in the URL), a signed-in user whose profile has a `home_airport` sees an
  unchecked "Only alert me near {ICAO} (my home airport)" checkbox in the
  `AlertSignup` box.
- Checking it and subscribing appends `airport=<ICAO>` to the alert's stored
  `source_path`; leaving it unchecked subscribes to the unnarrowed alert exactly
  as before (no behavior change when the box is absent or unchecked).
- The checkbox never renders for: signed-out visitors, signed-in visitors with
  no `home_airport`, `noun="aircraft"`/`"listing"`/`"seeking"`-detail watch boxes,
  `watchOnly` boxes, or any path-segment/SEO partnership route.
- `alert_subscribed` fires with `near_home_airport: true` only when the box was
  checked at submit time.
- `npx tsc --noEmit` and `npx next build` stay clean; no new console errors.

## Out of scope
- Extending the same param onto path-segment SEO routes (would need
  `alert-digest`'s `resolveTarget` to read `qs` for those branches too —
  separate slice).
- Anonymous/one-tap-remembered-email flows (the checkbox only ever shows in the
  signed-in branch, since it requires a signed-in `home_airport`).
- Any schema change (`profiles.home_airport` and `source_path`'s query-string
  encoding both already exist).
