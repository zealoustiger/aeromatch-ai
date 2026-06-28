# nnumber-make-fallback

## Goal
Fix the N-number / AI autofill so it correctly fills the **required** Make field for
aircraft makes outside the 8-item dropdown preset (Maule, Aviat, Bellanca, Aeronca,
American Champion, Socata, etc.) instead of silently leaving it blank.

## Why (activation — Pillar 1: frictionless posting)
The aircraft and partnership post forms have a fixed `MAKES` dropdown of 8 makes plus
"Other". The N-number lookup (`/api/faa-lookup`) maps the FAA manufacturer name to one
of those 8 via `matchMake`, returning `''` for anything else. The form then does
`makeSelect.value = data.make` — but setting a `<select>` to a value with no matching
`<option>` is a no-op, so Make (a **required** field) stays blank even though the
status reads "Found: 1978 Maule M-5" and Model/Year fill in. The owner of any
non-preset make hits a confusing validation error or a blank required field. The AI
prefill path (`generate*Draft`) has the same flaw — the LLM can return any make string.
This is a posting-flow bug in a recently-shipped activation feature; fixing it both
removes friction AND improves data integrity (the real make is stored, not blank/"Other").

## Scope (small)
- `src/app/api/faa-lookup/route.ts` — when the FAA make isn't one of the 8 canonical
  makes, return the registry's own make name in clean Title Case (drop trailing
  corporate suffixes) instead of `''`. Never invent a name; `''` only when FAA gave none.
- `src/components/PostAircraftForm.tsx` — add a `fillMakeSelect` helper that injects an
  `<option>` for makes not already in the dropdown (inserted before "Other"), then
  selects it. Use it in both the N-number lookup and AI-prefill paths.
- `src/components/PostPartnershipForm.tsx` — same `fillMakeSelect` helper + wiring.

## Acceptance criteria
- `npx next build` + typecheck pass.
- QA smoke (HTTP 200 / no app console errors / no horizontal overflow at 1280 + 375)
  passes on `/aircraft/new` and `/partnerships/new`.
- For a make outside the 8 presets, the form's Make `<select>` ends up showing/holding
  the real make value (a new option is injected) — verified by reading the helper logic
  (no live FAA call needed in QA).
- Canonical makes (Cessna, Piper, …) still select their existing option (no duplicate
  option injected).
- The required Make field is no longer left blank when the lookup/AI returns a non-preset make.

## Out of scope
- No change to the make dropdown's preset list, browse/search filters, or comp/family logic.
- No URL-scrape prefill, no schema changes, no auth changes.
- Seeker form (no make `<select>` — uses a free-text "preferred makes" input).
