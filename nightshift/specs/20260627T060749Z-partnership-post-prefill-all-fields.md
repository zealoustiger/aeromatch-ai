# Spec: partnership-post-prefill-all-fields

**UTC:** 2026-06-27T06:07:49Z  
**Pillar:** 1 — Frictionless listing posting  
**Slug:** partnership-post-prefill-all-fields

## Goal
Extend the "Generate with AI ✨" box on `/partnerships/new` so pasting listing notes or an existing listing populates *every* structured field — make, model, year, N-number, home airport (ICAO), share type, total/available shares, buy-in price, monthly fixed cost, and wet rate — in addition to title + description. Mirror the pattern already live on `/aircraft/new` (`aircraft-post-prefill-all-fields`).

## Scope
- `src/app/actions.ts` — add `PartnershipDraft` interface; extend `generatePartnershipDraft` system prompt + tool schema to extract structured fields; return them.
- `src/components/PostPartnershipForm.tsx` — add `fillFormField` helper; update `handleGenerate` to fill all extracted fields; relabel AI box to "Prefill from your notes ✨".

## Acceptance criteria
1. Pasting notes that mention aircraft (e.g. "2004 Cessna 172S, KAUS, 1/3 share, $15k buy-in, $300/mo, $85/hr wet") populates make, model, year, home airport, share type, buy-in price, monthly fixed, and wet rate — in addition to title + description.
2. Fields that aren't mentioned in the input are left blank (no fabrication).
3. The AI box label reads "Prefill from your notes ✨" and the subtext reflects that the whole form prefills.
4. `npx next build` passes with no TypeScript errors.
5. QA smoke passes on `/partnerships/new` at desktop 1280 + mobile 375 (HTTP 200, zero console errors, zero overflow).
6. Logged-in and guest paths both work (no regression to deferred-gate behaviour).

## Out of scope
- Contact fields (name/email/phone) — private/personal, don't auto-fill.
- Scheduling system — too contextual to extract reliably.
- `generateSeekerDraft` extension (next slice).
- Any schema or DB changes.
