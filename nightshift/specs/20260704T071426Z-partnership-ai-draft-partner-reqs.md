# partnership-ai-draft-partner-reqs

## Goal
Extend the partnership form's "Prefill from your notes ✨" AI draft to also extract
`min_hours` and `ratings_required`, closing a parity gap vs. the seeker form (which already
extracts its analogous `hours_per_month`/`ratings_held` fields).

## Scope
- `src/app/actions.ts` — `PartnershipDraft` interface, `draftPartnershipFromText`'s system
  prompt + `input_schema` + return mapping: add `min_hours` (integer) and `ratings_required`
  (comma-separated string, mirroring `ratings_held`'s extraction wording in `SeekerDraft`).
- `src/components/PostPartnershipForm.tsx` — `handleGenerate()`: fill `[name="min_hours"]`
  and `[name="ratings_required"]` from the draft result (mirrors every other field in this
  function); include both in the "auto-open More details" `hasOptional` check (both fields
  already live inside the `<details>` disclosure).

## Acceptance criteria
- `PartnershipDraft` has `min_hours?: number` and `ratings_required?: string`.
- The extraction system prompt + `input_schema` in `draftPartnershipFromText` describe both
  fields (never invent — omit when not mentioned), and the return mapping passes them through.
- Pasting text like "looking for a partner with 250+ hours, PPL and IFR rating, min 100
  hrs/yr" into the partnership form's AI box fills the "Minimum Hours" number input and
  checks/fills the "Ratings Required" chips/text field.
- "More details" auto-opens when the AI fills either field (matches existing behavior for
  every other optional field).
- `npx tsc --noEmit` and `npx next build` both pass clean.
- QA smoke passes on `/partnerships/new` (create form) and a real `/partnerships/[id]/edit`
  page (edit form uses the same component) at desktop 1280 + mobile 375: HTTP 200, zero
  app-origin console errors, zero horizontal overflow.

## Out of scope
- No schema change (both are native `partnerships` columns already used by the manual form).
- No change to `scheduling_system` (a third "Partner requirements" field) — not requested,
  not extracted by the seeker form's analogous section either.
- No change to the seeker or aircraft forms.
