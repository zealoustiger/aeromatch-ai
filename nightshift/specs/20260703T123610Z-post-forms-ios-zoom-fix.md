# post-forms-ios-zoom-fix

## Goal
Stop iOS Safari from auto-zooming the viewport every time a visitor taps into any
text field on the three post forms (`/aircraft/new`, `/partnerships/new`,
`/partnerships/seeking/new`), by ensuring every text input/select/textarea renders
at ≥16px on mobile — a real, previously-unaddressed mobile posting-friction bug
(Pillar 1). iOS Safari auto-zooms on focus for any input computed font-size < 16px;
Tailwind's `text-sm` is 14px, and all three forms' shared field components use it.

## Scope
- `src/components/PostPartnershipForm.tsx` — shared `Input`/`Select` components
  (lines ~80-104) + 2 standalone textareas (AI-draft notes box ~462, Description ~617)
- `src/components/PostAircraftForm.tsx` — shared `Input` component (~49-56) + AI-draft
  textarea (~360) + Description textarea (~501)
- `src/components/PostSeekerListingForm.tsx` — shared `Input`/`Select` components
  (~92-112) + AI-draft textarea (~420) + Description textarea (~738)
- `src/components/AirportFormInput.tsx` — the ICAO input used by all 3 forms (~119)
- Change: `text-sm` → `text-base sm:text-sm` on each of the above so mobile (<640px)
  renders 16px (no iOS zoom) while desktop keeps the existing 14px density. No other
  className, spacing, or behavior changes.

## Acceptance criteria
- All text `<input>`, `<select>`, and `<textarea>` elements on the 3 post forms
  (including the AI-draft and description boxes, and the shared airport ICAO input)
  compute to ≥16px font-size at a 375px viewport.
- Desktop (≥640px) visual density is unchanged (still 14px `text-sm`).
- No layout shift, overflow, or console errors introduced at 1280 or 375px on
  `/aircraft/new`, `/partnerships/new`, `/partnerships/seeking/new`.
- `npx next build` + typecheck pass.
- QA smoke passes on all 3 affected paths at both viewports.

## Out of scope
- Chip buttons, checkboxes, radio inputs (not affected by iOS input-zoom).
- Any other page's forms (e.g. `/auth`, `/searches`) — post forms only this cycle.
- Any field/schema/behavior change — pure CSS sizing fix.
