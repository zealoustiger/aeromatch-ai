# post-form-numeric-keypad

## Goal
Give every numeric field on the 3 post forms (aircraft-for-sale, partnership, seeker) a
dedicated numeric mobile keypad, instead of relying on the unreliable `type="number"`-only
signal, so posting from a phone (the realistic default for an owner at the hangar) doesn't
force a full QWERTY keyboard for price/year/hours/shares fields.

## Scope
- `src/components/PostAircraftForm.tsx` — local `Input` component (~line 71)
- `src/components/PostPartnershipForm.tsx` — local `Input` component (~line 93)
- `src/components/PostSeekerListingForm.tsx` — local `Input` component (~line 86)

Each file defines its own identical local `Input` wrapper used by every `type="number"`
field (asking_price, buy_in_price, year, ttaf, smoh, monthly_fixed, hourly_wet,
shares_available, total_shares, min_hours, max_buy_in, min_year, max_year, max_monthly,
max_hourly, total_hours, hours_per_month — 20 call sites total, none currently pass
`inputMode`). Give the shared `Input` wrapper a default `inputMode="numeric"` whenever
`type="number"` and no explicit `inputMode` was passed, so all 20 fields get it at once
with no per-call-site changes.

## Acceptance criteria
- All three forms' local `Input` component sets `inputMode="numeric"` by default when
  `type="number"`, unless a caller explicitly overrides `inputMode`.
- No call site needs to change; behavior applies uniformly via the shared wrapper.
- No visual change (the class list / styling is untouched) — purely an attribute addition.
- `npx tsc --noEmit` and `npx next build` pass clean.
- QA smoke passes on `/aircraft/new`, `/partnerships/new`, `/partnerships/seeking/new` at
  desktop 1280 + mobile 375 (HTTP 200, zero console errors, zero horizontal overflow).
- Manually confirm (via rendered HTML / DOM inspection) that a numeric field (e.g.
  `asking_price`) now renders `inputmode="numeric"` in the DOM.

## Out of scope
- Changing `min`/`max`/`step` validation behavior.
- Touching the shared `Input` component in any other forms/pages not listed above.
- The `EarningsCalculator` widget (already fixed for iOS zoom in a prior cycle;
  no evidence its inputs lack a numeric keypad — not part of this scope; a distinct
  standalone component, not one of the 3 post forms).
- The aircraft edit form's Home Airport prefill gap (flagged by research as a real but
  larger issue requiring a schema change to store raw ICAO on `aircraft_for_sale` —
  left for a future cycle, needs a human call on the schema addition).
