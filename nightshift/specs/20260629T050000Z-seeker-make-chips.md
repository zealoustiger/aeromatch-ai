# Spec — seeker-make-chips

## Goal
Cut recall/typing friction on the seeker post form's free-text **"Preferred Makes"** field
by adding a row of one-tap common-make chips (the right affordance for a multi-value,
comma-separated field where a `<datalist>` can't suggest the 2nd+ value) — advancing
Pillar 1 (frictionless posting) on the one post form still left with no make suggestions.

## Scope (small)
- `src/lib/csvList.ts` (new) — pure, testable helpers for a comma-separated value list:
  `parseCsvList`, `hasCsvItem`, `toggleCsvItem` (case-insensitive match, preserves other
  tokens and their original casing, trims, joins with `", "`).
- `src/lib/csvList.test.ts` (new) — node:test unit tests for the helpers.
- `src/components/PostSeekerListingForm.tsx` — render a one-tap make chip row above the
  existing `preferred_makes` `<Input>`; toggling a chip adds/removes that make in the
  comma-separated value, dispatches `input` (so autosave fires), and keeps a React state
  mirror so chip active-state reflects typing + AI prefill. Reuses the form's existing
  chip visual language; the text input stays editable for any other make.

## Acceptance criteria
- A row of common-make chips (Cessna, Piper, Beechcraft, Cirrus, Mooney, Van's, Diamond,
  Grumman — the same set the aircraft/partnership forms already use) renders above the
  Preferred Makes input inside "More details".
- Clicking a chip appends that make to the comma-separated `preferred_makes` value;
  clicking it again removes it (case-insensitive), leaving any other typed makes intact.
- Active chips are visually distinct (sky highlight), and reflect what's currently in the
  field — including values typed by hand and values written by the AI "Prefill" path.
- Free text is still fully allowed; the field stays optional; no change to the server
  action, validation, or data model (`preferred_makes` is still a plain string).
- `npx next build` + `tsc --noEmit` pass (no new errors in touched files); the new
  `csvList.test.ts` passes; qa-smoke exits 0 on `/partnerships/seeking/new` at 1280 + 375.

## Out of scope
- The seeker "Preferred Models" field (curated model datalist) — separate later slice.
- Any chips/changes on the aircraft or partnership forms (recently edited — avoid thrash).
- Schema/DB changes, new dependencies, anything in FREEZE.
