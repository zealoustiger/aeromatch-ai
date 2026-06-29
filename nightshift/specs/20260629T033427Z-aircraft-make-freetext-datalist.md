# Aircraft post form — free-text Make field with curated datalist

**Slug:** `aircraft-make-freetext-datalist`
**Pillar:** 1 (frictionless listing posting)
**Date:** 2026-06-29 (UTC)

## Goal
Let a seller post an aircraft of *any* make without dead-ending on "Other" — turn the
`/aircraft/new` Make field from a hard 9-option `<select>` into a free-text input backed by
a curated `<datalist>` of the makes already in our data, mirroring the existing Model field.

## Why (friction + data integrity)
Today the Make field is a constrained `<select>`: `Cessna, Piper, Beechcraft, Cirrus, Mooney,
Van's, Diamond, Grumman, Other`. A seller of a make outside that list who fills the form
manually (no N-number, no AI prefill) can only pick **"Other"** — losing their real make.
That is both friction (no way to enter it) and a data-integrity loss: make stored as "Other"
never matches the buyer-side comp / ClubHanger Estimate / model-family pages, which key off
`resolveMakeModelFamily` (a lowercased **substring** match on make — so a real free-text make
like "Maule" or "Bellanca" matches at least as well as, and usually better than, "Other").
Our own curated `SEO_MAKE_MODELS` already contains makes the dropdown omits (Bellanca,
Robinson, CubCrafters). Free text + a richer curated datalist fixes the dead-end while keeping
the common makes one-tap.

## Scope (small — one form)
- `src/components/PostAircraftForm.tsx` only:
  - Build a curated `MAKE_SUGGESTIONS` list = dedup union (by normalized key) of the existing
    `MAKES` (minus "Other") and the distinct makes in `SEO_MAKE_MODELS`, sorted. No fabricated
    data — every suggestion is a make already present in the codebase.
  - Replace the Make `<Select>` with a free-text `<Input list="aircraft-make-suggestions"
    autoComplete="off" required>` + a `<datalist>`.
  - Update the FAA-lookup / AI-prefill autofill to set the Make via the existing
    `fillFormField` (input event → fires React `onChange` → updates `selectedMake` → Model
    suggestions still narrow to the chosen make). Remove the now-unused `fillMakeSelect`
    option-injection helper.
  - Keep the `onChange` → `selectedMake` wiring and the mount-sync `useEffect` working with an
    input element.

## Acceptance criteria
- [ ] Make is a free-text input; typing an arbitrary make (e.g. "Maule") is accepted and
      submitted verbatim (no "Other" coercion).
- [ ] The datalist offers the common makes (Cessna, Piper, …) **plus** the extra curated makes
      (Bellanca, Robinson, CubCrafters) as one-tap suggestions.
- [ ] Make stays **required** (empty still blocks submit) — no data-integrity regression.
- [ ] FAA N-number lookup and AI "Prefill from your notes" still fill Make, and the Model
      datalist still narrows to the filled make's curated models.
- [ ] `next build` + typecheck pass; QA smoke (HTTP 200 / no app console errors / no h-overflow
      at 1280 + 375) passes on `/aircraft/new`; screenshots look correct.

## Out of scope
- The partnership form's identical Make `<select>` (next slice — note in CHANGELOG).
- The seeker form (no single-make field).
- Any change to the server action, validation rules, DB columns, or the Model field.
- Adding makes that aren't already represented in the codebase.
