# Spec: aircraft-description-above-fold

**Timestamp:** 2026-06-29T122959Z  
**Pillar:** 1 — Frictionless listing posting

## Goal
Reduce friction for aircraft sellers by surfacing the description field above the fold on `/aircraft/new`, instead of hiding it inside the "More details (optional)" collapsible.

## Problem
The aircraft post form buries Title and Description inside the "More details (optional)" `<details>` section alongside Year, TTAF, SMOH, and Engine. Sellers who don't expand that section submit listings with no description — producing thin, unconvincing listings that reduce buyer conversion. Description is the single most compelling part of a listing (what makes a buyer reach out); it should be as visible as Make, Model, and Price.

## Scope (files to touch)
- `src/components/PostAircraftForm.tsx`: move the Description textarea from inside `<details>` to a new visible "About this aircraft" section, placed after the Photos section and before the "More details" collapsible. Keep Title, Phone, Year, TTAF, SMOH, and Engine in `<details>`.
- Update the `hasOptional` auto-open logic so it no longer tries to open `<details>` when only `description` (now outside) is filled by AI — only open when year/ttaf/smoh/engine_type/title were filled.

## Acceptance criteria
1. On `/aircraft/new` at 1280px and 375px: the Description textarea is visible without expanding "More details"
2. The "More details (optional)" section still collapses/expands and contains Year, TTAF, SMOH, Engine type, Title, and Phone
3. The AI prefill still populates the Description field correctly (selector `[name="description"]` still works — field is still in the DOM, just outside `<details>`)
4. Draft autosave/restore still works for Description (no behavioral change — useFormDraft scans all named form fields)
5. Build (`npx next build`) and typecheck (`tsc --noEmit`) pass
6. No horizontal overflow at 1280px or 375px

## Out of scope
- Any change to the partnership or seeker post forms
- Moving Title out of "More details" (it auto-fills from make/model/year and is truly optional)
- Moving Phone
- Any change to the database schema or server actions
