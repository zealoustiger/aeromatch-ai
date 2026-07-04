# partnership-ai-draft-annual-damage

## Goal
Extend the partnership post form's "Prefill from your notes ✨" AI draft to also extract
`annual_due` and `damage_history` from pasted text/URLs, mirroring the existing
`ttaf`/`smoh`/`engine_type` extraction — so a poster who already typed "annual due March
2027, no damage history" doesn't have to separately fill those two fields by hand.

## Why this, why now
`partnership-annual-damage` (previous cycle, 2026-07-04) added the `annual_due`/
`damage_history` form fields and detail-page panels to partnerships, and its own "Next"
note flagged this exact follow-on as the natural next slice. Code audit confirms the gap
is real: `PartnershipDraft` (src/app/actions.ts) and `draftPartnershipFromText`'s system
prompt/tool schema extract `ttaf`/`smoh`/`engine_type` but not `annual_due`/
`damage_history`; `PostPartnershipForm.tsx`'s `handleGenerate()` auto-fills the former
three but not the latter two, even though both form fields now exist. Pillar 1 (posting
friction) rotation is due — the last two landed cycles were both Pillar 3
(`seeker-card-freshness`, `partnership-annual-damage`).

## Scope
- `src/app/actions.ts`:
  - `PartnershipDraft` interface: add `annual_due?: string` (month string, `"YYYY-MM"`)
    and `damage_history?: boolean`.
  - `draftPartnershipFromText`'s system prompt: add extraction rules for both fields —
    `annual_due` only when a specific month/year is stated (never guess a vague "annual is
    current"); `damage_history` true when damage/incident/accident history is stated,
    false when the input explicitly says no damage/incident history, omitted otherwise.
  - `draft_listing` tool's `input_schema.properties`: add `annual_due` (string) and
    `damage_history` (boolean).
  - Return-object mapping: pass both fields through.
- `src/components/PostPartnershipForm.tsx`:
  - `handleGenerate()`: auto-fill the `annual_due` month input and `damage_history` select
    when the draft returns them (boolean needs an explicit `!== undefined` check, not a
    truthy check, since `false` is a meaningful value here).
  - Extend the `hasOptional` check (which auto-opens "More details") to include these two
    fields.
- No schema/DB change (the columns already exist per last cycle's migration, applied or
  not — same graceful-degradation path already in place).

## Acceptance criteria
- `PartnershipDraft` type includes `annual_due`/`damage_history`.
- The AI system prompt + tool schema instruct extraction of both, with the same
  never-fabricate rule as every other field ("omit if not mentioned").
- `handleGenerate()` fills the `annual_due` month input and `damage_history` select when
  present in the AI response, including when `damage_history` is explicitly `false`.
- "More details" auto-opens when either field is extracted.
- `npx next build` + `npx tsc --noEmit` pass clean.
- QA smoke passes on `/partnerships/new` (desktop 1280 + mobile 375, HTTP 200, zero
  app-origin console errors, zero horizontal overflow).

## Out of scope
- Aircraft-for-sale form: it has no `annual_due`/`damage_history` form fields at all yet
  (a separate, larger Pillar 3 slice — add the fields first, same as the partnership form
  got last cycle — not a same-cycle add here).
- Seeker form: has no equivalent fields.
- Applying the still-pending `partnership_add_annual_damage`/`partnership_add_spec_fields`
  migrations (human action, called out in the prior cycle).
