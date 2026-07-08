# monetization-intent-cta

## Goal
Ship slice 1 of the backlog's "Monetization — intent signals" item: a reusable, honest
`MonetizationIntent` fake-door CTA component (button → "Coming soon" modal → optional
email capture + a `monetization_intent` PostHog event), and wire up ONE real placement
(a "Work with a broker" CTA on the aircraft-for-sale detail page) so the feature is live
and demonstrable — not just an unused component.

## Scope
- New `src/components/MonetizationIntent.tsx` (client component): a button that opens a
  modal styled like the existing `SignUpGate`/`SoftSavePrompt` pattern (rounded-2xl white
  card, sky-blue accents, backdrop-click-to-close, `role="dialog" aria-modal="true"`).
  Props: `path` (revenue-path id, e.g. `"broker"`), `label`, `title`, `description`,
  optional `className`.
  - Fires `track('monetization_intent', { path })` the moment the modal opens (the click
    itself is the demand signal for that revenue path).
  - Modal has an email field (optional) + "Get early access" submit; on submit with a
    valid email, upserts into the existing `waitlist` table via a small extension to
    `joinWaitlist` (add an optional `source` param, default `'hero_search'` to preserve
    the current call site's behavior) — no new table, no schema change.
  - Never claims a broker/service exists or charges anyone; copy is explicitly
    "Coming soon — want early access?".
- Extend `joinWaitlist(email, searchParams, source?)` in `src/app/actions.ts` — additive
  optional 3rd param only; existing `SignUpGate` call site unaffected (keeps default).
- Wire ONE placement: a "Work with a broker" `MonetizationIntent` CTA on
  `/aircraft/listing/[id]`, placed in the sidebar right after the existing `AlertSignup`
  box (same column, consistent with how other CTAs stack there).

## Acceptance criteria
- `/aircraft/listing/[id]` renders a new "Work with a broker" tasteful card/button below
  the alert-signup box; clicking it opens a modal, never navigates away or breaks anything.
- Modal: shows "Coming soon" copy, an email field, and a way to dismiss (X + backdrop
  click) without submitting.
- Submitting a valid email shows a success state and upserts a row into `waitlist` with
  `source='broker'` (verified directly against the DB with a throwaway `@example.com`
  address, then deleted before the cycle ends).
- Opening the modal fires a `monetization_intent` PostHog event with `{ path: 'broker' }`
  (verified via the `track()` call site, not by reading PostHog dashboards).
- No new backend/DB table; no live payment/broker network activated (UI + fake-door only,
  per FREEZE.md).
- `npx next build` + `tsc --noEmit` clean; `qa-smoke.mjs` passes at 1280 + 375 on
  `/aircraft/listing/[id]` with zero console errors / zero horizontal overflow.

## Out of scope
- Slices 2-4 (broker/financing/insurance/escrow/pre-buy CTAs across `/aircraft` results,
  partnership pages, post-flow seller upgrades; the admin tally panel). This cycle ships
  the reusable component + proves it with one real placement; future cycles place the
  remaining CTA types.
- Any real broker/partner integration, payment flow, or backend beyond the existing
  `waitlist` table.
