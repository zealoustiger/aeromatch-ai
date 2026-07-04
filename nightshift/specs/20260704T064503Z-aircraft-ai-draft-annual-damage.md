# aircraft-ai-draft-annual-damage

## Goal
Extend the "Prefill from your notes ✨" AI draft on the aircraft-for-sale post form to also
extract `annual_due` and `damage_history` from pasted text/URL, closing the last parity gap
flagged in the immediately prior cycle (`aircraft-annual-damage-form`'s Next note) versus the
partnership form's AI-draft, which already extracts both.

## Scope
- `src/app/actions.ts`:
  - `AircraftDraft` interface — add `annual_due?: string` and `damage_history?: boolean`.
  - `draftAircraftFromText`'s system prompt — add extraction instructions for both fields
    (mirror the partnership prompt's wording, including the "only when a specific month/year
    is stated" / "never guess" rule for `annual_due`).
  - The tool's `input_schema.properties` — add both fields.
  - The return mapping — add both, with the same `/^\d{4}-\d{2}$/` format guard on
    `annual_due` the partnership path uses (defense against a malformed AI output reaching
    the `<input type="month">`).
- `src/components/PostAircraftForm.tsx`:
  - `handleGenerate()` — add `fillFormField` calls for `annual_due` (default `input` event)
    and `damage_history` (`change` event, checked via `!== undefined` since `false` is a
    real, distinct extracted value — mirrors the partnership form's comment/logic exactly).
  - Extend the `hasOptional` auto-open check to include both new fields.

## Out of scope
- No schema/DB migration — `aircraft_for_sale.annual_due`/`damage_history` columns already
  exist natively (used by the manual form fields shipped last cycle).
- No changes to the partnership or seeker AI-draft paths (already done / not applicable).
- No changes to `AnnualStatusPanel`/`DamageHistoryPanel` rendering logic (unchanged).

## Acceptance criteria
- `npx next build` and `npx tsc --noEmit` both pass with zero errors.
- A pasted note like "annual due March 2027, no damage history" fills `annual_due` to
  `2027-03` and `damage_history` to "No damage reported" on `/aircraft/new` (verified via a
  direct DOM-level check of the same `fillFormField` mechanism `handleGenerate()` uses, per
  the sandbox's no-live-AI-session limitation noted in prior AI-draft cycles).
- A malformed/missing `annual_due` from the model never reaches the `<input type="month">`
  unfilled-but-invalid (format-guarded server-side, same as partnerships).
- QA smoke passes on `/aircraft/new` (and `/post`, since it embeds the same form) at desktop
  1280 + mobile 375: HTTP 200, zero app-origin console errors, zero horizontal overflow.
- No regression to the existing make/model/year/ttaf/smoh/engine_type/asking_price/home_airport
  extraction already working on this form.
