# aircraft-post-engine-type

**Pillar:** 3 — proprietary, honest buyer-analysis on listing pages (delivered via a
minimal Pillar-1 posting field). Rotation: last cycle was Pillar 1; Pillar 2's headline
items (Google OAuth, email-only form) remain human-blocked behind frozen `/auth`; the
aircraft detail page's spec-extracted analysis modules are saturated and the partnerships
table lacks the spec columns — so this extends an existing proprietary module's
*coverage* instead of inventing a thin new one.

## Goal
Capture **engine type** on the aircraft post form (manual + AI-prefilled) and persist it,
so **user-posted aircraft can finally show the proprietary Engine Life & overhaul-reserve
analysis** — which needs `engine_type` + `smoh` and today never renders on `source='user'`
listings because the form never collected it.

## Why this is honest + proprietary
- `aircraft_for_sale.engine_type` already exists and powers `computeEngineLife`
  (curated TBO table). Scraped listings populate it; user-posted ones can't. This closes
  that gap — no new data model, no fabrication.
- The Engine Life panel already self-suppresses when the engine string doesn't match a
  known piston-GA TBO family, so an unrecognized free-text entry simply shows nothing —
  never a wrong number.

## Scope (small, additive)
- `src/components/PostAircraftForm.tsx` — add an optional **Engine** text input inside the
  existing "More details" progressive-disclosure block (next to SMOH); add the AI-prefill
  fill line (`if (result.engine_type) fillFormField(form, '[name="engine_type"]', …)`) and
  include it in the `hasOptional` auto-open check.
- `src/app/actions.ts` —
  - `createAircraftListing`: persist `engine_type: (formData.get('engine_type') as string) || null`.
  - `AircraftDraft`: add optional `engine_type`; add it to the draft system prompt, the
    `draft_listing` tool schema, and the return mapping (same pattern as `ttaf`/`smoh`).

## Acceptance criteria
- `/aircraft/new` renders an optional **Engine** field in "More details"; it is NOT required.
- Submitting the form with an engine value persists it to `aircraft_for_sale.engine_type`
  (verified by reading the payload mapping; no schema change — column already exists).
- "Prefill from your notes" (AI draft) maps an engine designation from the pasted blob into
  the Engine field when present, and omits it otherwise (never invents one).
- On a listing that has both a recognized `engine_type` + `smoh`, the existing Engine Life
  panel renders (unchanged behavior; now reachable for user-posted listings).
- `npx next build` + typecheck pass; QA smoke (HTTP 200 / no app-console errors / no
  horizontal overflow at 1280 + 375) passes on `/aircraft/new`.
- No change to required fields, validation, auth, or the listing detail page code.

## Out of scope
- Adding `annual_due` / `damage_history` / `avionics` capture (separate future slices).
- Any change to `engineLife.ts`, the detail page, or the Engine Life panel itself.
- Backfilling engine_type on existing rows.
