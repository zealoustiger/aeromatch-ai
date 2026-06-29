# Spec: partnership-post-spec-fields
**Timestamp:** 2026-06-29T063048Z
**Slug:** partnership-post-spec-fields

## Goal
Add optional TTAF, SMOH, and Engine Type fields to the partnership post form so that user-posted partnerships can capture the spec data needed by the Engine Life, Airframe Time, and Overhaul Timeline analysis panels on the partnership detail page. Mirrors what `aircraft-post-engine-type` did for the aircraft form.

## Scope
- `src/components/PostPartnershipForm.tsx` — add 3 optional fields inside "More details" (Aircraft section), update AI-prefill fill logic
- `src/app/actions.ts` — (1) extend `PartnershipDraft` interface with `ttaf?`, `smoh?`, `engine_type?`; (2) extend `generatePartnershipDraft` system prompt + tool schema to extract these; (3) update `createPartnership` payload to include these three fields
- `supabase/schema.sql` — add 3 additive `alter table partnerships add column if not exists` statements

## Acceptance criteria
1. `/partnerships/new` → "More details" section shows optional TTAF, SMOH, and Engine fields, styled identically to the same fields on the aircraft post form (`/aircraft/new`)
2. The AI "Prefill from your notes ✨" button extracts `ttaf`, `smoh`, `engine_type` from pasted notes and fills these new fields (verified by code review of the AI prompt + handler)
3. `createPartnership` server action includes `ttaf`, `smoh`, `engine_type` in its Supabase insert payload
4. `supabase/schema.sql` contains the 3 additive alter statements with a clear migration comment; CHANGELOG loudly flags the human must apply them
5. `npx next build` + `tsc --noEmit` pass with zero new errors
6. `qa-smoke.mjs --slug partnership-post-spec-fields /partnerships/new` exits 0 (HTTP 200, no app-origin console errors, no horizontal overflow at desktop 1280 + mobile 375)

## Out of scope
- Changing the partnership detail page — the Engine Life, Airframe Time, and Overhaul Timeline panels already self-suppress when smoh/ttaf/engine_type are null; they'll light up automatically once the migration is applied and data flows in
- Adding spec fields to the seeker form (seekers don't own the aircraft)
- Any new analysis logic — reuses existing `computeEngineLife`, `computeAirframeUsage`, `computeOverhaulTimeline` unchanged
