# Spec: seeking-post-prefill-all-fields

**Timestamp:** 2026-06-27T06:56:07Z  
**Pillar:** Pillar 1 — Frictionless listing posting  
**Slug:** seeking-post-prefill-all-fields

## Goal
Extend the seeker form's "Generate with AI" box to prefill the entire form — not just title and description — from pasted notes. Mirrors the pattern already live on `/aircraft/new` (`aircraft-post-prefill-all-fields`) and `/partnerships/new` (`partnership-post-prefill-all-fields`).

## Scope
- `src/app/actions.ts` — export new `SeekerDraft` interface; extend `generateSeekerDraft` system prompt + tool schema to also extract preferred makes/models, aircraft category, year range, budget (max buy-in / monthly / wet rate), home airport (ICAO), commute distance, total hours, ratings, hours/month; return all fields.
- `src/components/PostSeekerListingForm.tsx` — add `fillFormField` helper; extend `handleGenerate` to fill all returned fields; relabel AI box subtext to "the AI will prefill the whole form".

## Acceptance criteria
- [ ] Pasting notes like "IFR pilot, 450 hrs, KPAO, looking for Cessna 182 or SR22, max $25k buy-in, $400/mo, ~1hr commute" into the AI box and clicking "Prefill from your notes ✨" populates: preferred makes (Cessna, Cirrus), preferred models (182, SR22), home airport (KPAO), max buy-in ($25,000), max monthly ($400), and the title + description.
- [ ] Fields not present in the input remain blank (no fabrication).
- [ ] AI box label updates to "Prefill from your notes ✨" and subtext says "the AI will prefill the whole form (aircraft preferences, budget, location, pilot profile, title, and description)".
- [ ] `npx next build` compiles clean (exit 0, no TypeScript errors).
- [ ] QA smoke exit 0 on `/partnerships/seeking/new` + `/partnerships/new` at desktop 1280 + mobile 375.

## Out of scope
- Checkbox groups (`intended_use_check`, `share_type_check`) — too complex to drive programmatically without a controlled component rewrite; skip for this slice.
- Contact fields (name, email) — personal info, not extractable from listing notes.
- Rate limiting / cost cap (BACKLOG slice 3 — deferred).
