# seeker-ai-draft-share-use

## Goal
Make the seeker listing form's "Prefill from your notes ✨" AI draft also auto-check the
Intended Use and Preferred Share Types checkbox groups, so a pilot who mentions those in
their free-text note doesn't have to separately tap through both checkbox groups by hand.

## Scope
- `src/app/actions.ts` — `SeekerDraft` interface, `generateSeekerDraft`'s system prompt +
  `draft_listing` tool schema + return object: add `preferred_share_types?: string[]` and
  `intended_use?: string[]`, constrained to the same enum values the form already renders
  (`SHARE_TYPES` / `INTENDED_USE_OPTIONS` in `PostSeekerListingForm.tsx`).
- `src/components/PostSeekerListingForm.tsx` — `handleGenerate()`: when the AI draft returns
  either field, check the matching checkboxes in the `intended_use_check` / `share_type_check`
  groups and dispatch a bubbling `change` event so the existing `syncCheckboxes` script (which
  already listens for `change` on the form) writes them into the hidden inputs exactly like a
  manual click would. Also fold both fields into the existing `hasMoreDetails` check that
  auto-opens the "More details" `<details>` panel.

## Acceptance criteria
- Typing a note that mentions a share size (e.g. "looking for a 1/3 share") into the AI
  prefill box and clicking "Prefill from your notes ✨" checks the matching "1/3" chip in
  Preferred Share Types, without the user manually tapping it.
- Typing a note that mentions intended use (e.g. "weekend trips and cross-country flying")
  checks the matching "Weekend Trips" / "Cross Country" chips in Intended Use.
- Fields not mentioned in the note are left unchecked (never invents a selection).
- The "More details" panel auto-opens when the AI draft fills either checkbox group (mirrors
  existing behavior for the other AI-filled fields).
- Manual checkbox interaction and form submission (hidden `preferred_share_types` /
  `intended_use` inputs → server action) are unchanged — this only adds a new way to arrive
  at the same checked state.
- `npx next build` and `tsc --noEmit` both pass; QA smoke passes on `/partnerships/seeking/new`.

## Out of scope
- Any change to the partnership or aircraft post forms.
- Any change to the seeker form's other AI-extracted fields (makes/models/budget/airports/etc.).
- Adding URL-paste to the seeker form (intentionally out — no external source listing to fetch).
- Schema/DB changes — `preferred_share_types`/`intended_use` columns and their comma-separated
  wire format already exist and are unchanged by this cycle.
