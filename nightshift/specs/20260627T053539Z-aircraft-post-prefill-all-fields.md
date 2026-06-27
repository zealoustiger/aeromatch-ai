# Spec: aircraft-post-prefill-all-fields

**UTC:** 2026-06-27T05:35:39Z  
**Pillar:** 1 — Frictionless listing posting  
**Slug:** aircraft-post-prefill-all-fields

## Goal
When a seller pastes any listing text or notes into the "Generate with AI" box on `/aircraft/new`, the AI extracts and fills **all** structured form fields — make, model, year, TTAF, SMOH, price, location, state, registration — in addition to title and description. One paste replaces filling 10+ fields manually.

## Scope (files to touch)
- `src/app/actions.ts` — extend `generateAircraftDraft` return type + tool schema to include optional structured fields; update system prompt to extract them
- `src/components/PostAircraftForm.tsx` — extend `handleGenerate` to fill all returned fields; update AI box subtext

## Acceptance criteria
1. Pasting `"2006 Cessna 182T, G1000, 2450 TTAF, 600 SMOH, $285,000, based at KAUS, Austin TX"` → AI returns make=Cessna, model=182T, year=2006, ttaf=2450, smoh=600, asking_price=285000, location="Austin, TX", state="TX" and the form fields are populated.
2. Fields the AI cannot extract from the input are left blank / untouched (no fabrication).
3. `generateAircraftDraft` remains backward-compatible (still returns `{ title, description }` plus optional extras).
4. `npx next build` compiles cleanly with no TypeScript errors.
5. QA smoke: `/aircraft/new` → HTTP 200, zero app-origin console errors, zero horizontal overflow at 1280px and 375px.

## Out of scope
- Partnership or seeker forms
- Auth changes
- Photo upload
- New API routes
