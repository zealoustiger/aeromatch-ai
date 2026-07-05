# airport-input-start-over-reset

## Goal
"Start over" / "Revert changes" on all 3 post/edit forms must also clear `AirportFormInput`'s
internal invalid/suggestion/location-error state, so a poster fixing a typo'd airport code via
Start Over doesn't land on a field that still shows the red "Select an airport from the list…"
error after the value has been cleared or reverted.

## Scope
- `src/components/AirportFormInput.tsx` — no change needed to internal logic; it already
  resets its own state on `onChange`/`pick`. The fix is external: force a remount.
- `src/components/PostAircraftForm.tsx` — add `airportMountKey` state, bump it in
  `handleStartOver`, pass `key={airportMountKey}` to the one `<AirportFormInput>` (Based at).
- `src/components/PostPartnershipForm.tsx` — same pattern, one `<AirportFormInput>` (Home Airport).
- `src/components/PostSeekerListingForm.tsx` — same pattern, applied to both
  `<AirportFormInput>` instances (Home Airport + "Also flying from"), sharing one mount key.

This mirrors the existing `photoMountKey` pattern already used in all 3 forms to force-remount
`PartnershipPhotoUpload` on Start Over, for the identical reason (`reset()`/`form.reset()`
doesn't dispatch `input`/`change`, so components with their own internal React state never hear
about the clear).

## Acceptance criteria
- On `/aircraft/new`, `/partnerships/new`, `/partnerships/seeking/new`: typing an invalid
  4-char code (e.g. `KUAS`) into the airport field shows the red invalid state; clicking
  "Start over" and confirming clears the field AND the red border/error message disappear.
- On the 3 edit pages: with the airport field showing the invalid state (typed over a valid
  saved value), clicking "Revert changes" restores the original value with no lingering error.
- No change to normal (non-Start-Over) airport autocomplete/selection/validation behavior.
- `npx next build` + typecheck pass clean.
- QA smoke passes on all 6 affected routes (3 new + 3 edit) at desktop 1280 + mobile 375:
  HTTP 200, zero app-origin console errors, zero horizontal overflow.

## Out of scope
- Any change to `AirportFormInput`'s validation/lookup logic itself.
- The two human-blocked Pillar 1 items (aircraft edit Home Airport schema gap; "collapse to
  one screen" measurement pass).
- Pillar 2's flagged `PostSeekerListingForm.tsx` live-auth-state gap (separate slice).
