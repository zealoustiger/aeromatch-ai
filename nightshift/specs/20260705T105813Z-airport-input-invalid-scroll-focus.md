# airport-input-invalid-scroll-focus

## Goal
When the shared airport-code field fails native pattern validation on submit, scroll it into
view and focus it — so a poster on any of the 3 post/edit forms gets *visible* feedback
instead of a submit click that silently appears to do nothing.

## Background (verified against live code)
`src/components/AirportFormInput.tsx` (shared by `PostAircraftForm.tsx`,
`PostPartnershipForm.tsx`, and the seeker form) uses a native `pattern="[A-Za-z0-9]{4}"` on
the `<input>`, and its `onInvalid` handler calls `e.preventDefault()` to suppress the
browser's default validation-bubble UI in favor of a small inline rose message. But
`preventDefault()` on the `invalid` event also removes the browser's native
focus-and-scroll-into-view behavior for that control. The field's own placeholder/label
explicitly invite free text ("City, IATA, or ICAO (e.g. Austin, AUS, KAUS)"), so a user who
types "Austin" and tabs/clicks away without picking a dropdown suggestion — common on mobile,
or when the debounced dropdown hasn't rendered yet — fails the pattern check on submit with
zero visible signal if that field has scrolled out of the current viewport (it's near the top
of "The basics"; submit is at the very bottom past photos/description/more-details). Net
effect: clicking "Post Aircraft for Sale" / "Post Partnership Listing" / "Post Seeking
Listing" / "Save Changes" appears to do nothing.

## Scope
- `src/components/AirportFormInput.tsx` — in the `onInvalid` handler, after
  `setIsInvalid(true)`, call `scrollIntoView({behavior: 'smooth', block: 'center'})` and
  `.focus()` on the input so the field (and its existing rose error message) becomes visible
  regardless of scroll position, on all 3 forms that share this component.

## Out of scope
- No change to the validation rule itself (still requires an exact 4-char ICAO — free-text
  city/IATA must still resolve via a dropdown pick or the exact-match debounce). Loosening
  validation to auto-accept ambiguous city text risks silently attaching the wrong airport,
  which would trade a friction win for a data-integrity loss (against GOAL.md's guardrail).
- No change to the dropdown/suggestion/geolocation logic.
- No change to `actions.ts` or any server-side validation.

## Acceptance criteria
- On `/aircraft/new`, `/partnerships/new`, and `/partnerships/seeking/new` (and their `/edit`
  counterparts), typing an invalid/incomplete airport value (e.g. "Austin" without picking a
  suggestion) and clicking submit scrolls that field into view and focuses it.
- The existing inline rose "Select an airport from the list…" message still renders unchanged.
- A valid 4-char ICAO code (typed directly or picked from the dropdown) still submits normally
  with no change in behavior.
- `npx next build` + typecheck pass.
- QA smoke passes (HTTP 200, no console errors, no horizontal overflow) on all 3 affected
  post pages at desktop 1280 + mobile 375.
