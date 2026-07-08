# monetization-services-cta

## Goal
Add the remaining honest "fake-door" service-intent CTAs (financing, insurance,
escrow/title, pre-buy inspection) to the aircraft-for-sale listing detail page,
completing the listing-detail half of the backlog's monetization slice 2 (the
broker CTA already shipped last cycle).

## Scope
- `src/app/aircraft/listing/[id]/page.tsx` — add a new "More ways we can help"
  card below the existing "Work with a broker" `MonetizationIntent` CTA, with 4
  compact `MonetizationIntent` buttons (financing / insurance / escrow-title /
  pre-buy inspection) in a 2x2 grid. Reuses the existing `MonetizationIntent`
  component and `joinWaitlist` action verbatim — no new component, no schema
  change.
- No other files touched.

## Acceptance criteria
- `/aircraft/listing/[id]` renders a new card with 4 buttons: Financing,
  Insurance, Escrow/title, Pre-buy inspection — below the existing broker CTA.
- Clicking each button opens the existing "Coming soon" modal and fires
  `track('monetization_intent', { path: '<financing|insurance|escrow|prebuy>' })`
  — verified the event path differs per button (not all sharing "broker").
  Submitting an email in the modal writes a `waitlist` row with the matching
  `source` and shows the existing success state (no new backend path — same
  `joinWaitlist` server action used by the broker CTA already proved working
  last cycle).
- No card ever claims the service exists today; copy matches the existing
  "gauging interest" honesty pattern.
- Desktop 1280 + mobile 375: no horizontal overflow, no new console errors,
  buttons fit the sidebar column width without breaking layout.
- `npx next build` + `tsc --noEmit` clean.

## Out of scope
- Placing these CTAs on `/aircraft` browse results (separate slice).
- Partnership-page formation/management CTAs (slice 3).
- Admin tally of clicks-per-path (slice 4).
- Any change to the existing broker CTA's copy/placement/behavior.
