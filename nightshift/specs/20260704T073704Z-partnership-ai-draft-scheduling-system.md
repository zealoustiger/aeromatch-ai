# partnership-ai-draft-scheduling-system

## Goal
Close the last unshipped AI-draft parity gap in the partnership post form's "Partner
requirements" section: extract `scheduling_system` alongside the just-shipped
`min_hours`/`ratings_required`, so "Prefill from your notes ✨" fills the whole section
instead of silently dropping one of its three fields.

## Scope
- `src/app/actions.ts`: `PartnershipDraft` interface, the extraction prompt's field list,
  the `draft_listing` tool's `input_schema.properties`, and the mapped return object in
  `draftPartnershipFromText` — add `scheduling_system?: string` mirroring `ratings_required`.
- `src/components/PostPartnershipForm.tsx`: in `handleGenerate`, add
  `if (result.scheduling_system) fillFormField(form, '[name="scheduling_system"]', result.scheduling_system)`
  and add `result.scheduling_system` to the `hasOptional` auto-open check.

## Acceptance criteria
- `PartnershipDraft` includes `scheduling_system?: string`.
- The Haiku prompt's field list and the tool's `input_schema` both describe
  `scheduling_system` (free text, e.g. "FlyingClub, Google Calendar, shared spreadsheet").
- `draftPartnershipFromText`'s returned object passes through `f.scheduling_system`.
- Pasting partnership text that mentions a scheduling system (e.g. "we use a shared Google
  Calendar to schedule flights") auto-fills the "Scheduling system" input on `/partnerships/new`.
- `hasOptional` auto-opens "More details" when only `scheduling_system` was extracted.
- `npx next build` + typecheck pass; QA smoke passes on `/partnerships/new`.

## Out of scope
- No schema/migration change (`scheduling_system` is already a column, already saved by
  `createPartnership`/`updatePartnershipListing`, already prefilled on the edit page).
- No changes to the aircraft or seeker forms.
- Not touching the structured partnership `avionics` gap (bigger, multi-cycle item, noted
  as a runner-up).
