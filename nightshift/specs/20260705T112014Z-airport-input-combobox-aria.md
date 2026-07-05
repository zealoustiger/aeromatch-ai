# airport-input-combobox-aria

**Goal:** Wire proper ARIA combobox attributes onto `AirportFormInput`'s autocomplete
input so screen-reader/keyboard users get an accessible signal when the suggestion
dropdown opens, which option is highlighted, and what `Enter` will commit — closing a
posting-flow dead-end on the required Home Airport field (2 of 3 post forms).

**Scope:**
- `src/components/AirportFormInput.tsx` only — shared by all 3 post/edit forms
  (`PostAircraftForm.tsx`, `PostPartnershipForm.tsx`, `PostSeekerListingForm.tsx`, 4
  call sites total). No other files need changes; no schema/prop-signature change.

**Acceptance criteria:**
- The suggestion `<ul>` has a stable `id` (via `useId()`), and each `<li role="option">`
  has a matching `id` derived from it.
- The `<input>` gets `role="combobox"`, `aria-expanded` (true when suggestions are
  showing), `aria-controls` pointing at the listbox id, `aria-autocomplete="list"`, and
  `aria-activedescendant` reflecting the currently-active suggestion (or unset when none
  is active).
- Existing keyboard behavior (ArrowUp/Down, Enter, Escape) and mouse-click selection are
  unchanged.
- `npx next build` + typecheck pass.
- QA smoke passes on `/aircraft/new`, `/partnerships/new`, `/partnerships/seeking/new`
  (desktop 1280 + mobile 375): HTTP 200, no new console errors, no horizontal overflow.
- Visually, the input/dropdown/📍 button render identically to before (this is an ARIA-
  attribute-only change, not a visual one — but these routes execute forms behavior so
  it's not a purely-content cycle).

**Out of scope:**
- The other known airport-autocomplete component `AirportAutocompleteInput.tsx` (used
  elsewhere, e.g. search/filter UI, not the post forms) — separate scope, not part of
  this pillar-1 posting-flow fix.
- Any visual redesign of the dropdown.
- The two known human-blocked Pillar 1 items (aircraft edit form's Home Airport schema
  gap; "collapse to one smart screen" status-check).
