# alert-matchcount-bare-root

## Goal
Add the honest "N listings match right now" live-count line to the four `sourcePath="/"`
`<AlertSignup>` capture boxes that predate `getAlertMatchCount('/')` support (homepage band,
`/about`, `not-found.tsx`, `/saved`'s two bare-root fallback boxes) — same one-line pattern
`alertsignup-matchcount-sweep` already applied to the guide pages.

## Scope
- `src/app/page.tsx` — homepage `homepage_band` box (already `async`).
- `src/app/about/page.tsx` — `about_page` box; convert `AboutPage` to `async` (no `'use client'`,
  safe).
- `src/app/not-found.tsx` — `not_found` box; convert `NotFound` to `async` (no `'use client'`,
  safe; static params/metadata untouched).
- `src/app/saved/page.tsx` — the two bare-`/` `saved_page` boxes (line ~184 fully-empty state,
  line ~291 fallback when `savedAlertCtx` is null). The `savedAlertCtx`-driven box (line ~284,
  its own specific context/sourcePath) is untouched — out of scope.
- Each site: `const matchResult = await getAlertMatchCount('/')` then
  `matchCount={matchResult?.count} noun="listing"` added to the `<AlertSignup>` call (`noun`
  matches what `getAlertMatchCount('/')`'s combined aircraft+partnership count actually is, so
  the pluralization/zero-state copy reads correctly — mirrors the exact pattern used for
  `noun="partnership"` on `/guides/aircraft-co-ownership`).

## Acceptance criteria
- All 5 call sites (homepage, about, not-found, saved×2) pass a real `matchCount` sourced from
  `getAlertMatchCount('/')`, never a fabricated number.
- Rendered HTML shows "{N} listings match right now — we'll email you when the next one lists."
  (or the honest zero-state line) on each of the 4 pages.
- `FooterAlertCapture` is untouched (deliberately count-free by design, per backlog note).
- `npx tsc --noEmit` and `npx next build` both exit 0.
- QA smoke passes (HTTP 200, zero app-console errors, zero horizontal overflow) at desktop 1280
  + mobile 375 on `/`, `/about`, a 404 URL, and `/saved` (logged-out empty + a state with saves).
- No schema/dependency/component-signature change; no new capture point or analytics event.

## Out of scope
- `FooterAlertCapture` (by design, stays thin).
- The `savedAlertCtx`-specific `/saved` box (already has its own context, not bare `/`).
- Checking off the stale `PartnershipLaunchBanner funnel parity` BACKLOG line from 2 cycles ago
  (already shipped via `partnershiplaunchbanner-funnel-parity`/`watch-offer-funnel-parity`, but
  never struck) — will fix that BACKLOG hygiene gap in the same commit since it's a one-line
  edit, but it is not this cycle's engineering scope.
