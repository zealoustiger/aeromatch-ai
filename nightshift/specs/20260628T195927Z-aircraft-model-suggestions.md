# Spec — aircraft-model-suggestions

**Pillar:** 1 — Frictionless listing posting (ACTIVATION pivot)
**Slice:** Make-aware model suggestions on the aircraft post form's Model field.

## Goal (one sentence)
On `/aircraft/new`, offer the seller a curated list of model-name suggestions
(filtered by the Make they picked) via a native `<datalist>`, so they don't have
to recall the exact canonical model string — removing recall friction while
keeping model values consistent for downstream comps.

## Why this pillar / why now
Rotation: recent cycles were P3 (days-on-market-vs-comps), P1 (post-photos-survive-auth,
photo persistence), P2 (soft-save-keep-intent). Pillar 2's headline items (Google OAuth,
email-only form) are human-blocked behind the frozen `/auth`, and the `?next=` intent
pattern is already fully wired — so a contrived P2 change is discouraged. P3 was the most
recent cycle. This is a **fresh Pillar 1 surface** (the Make/Model entry) distinct from
the recent photo / N-number / draft-lifecycle slices.

## Scope (small)
- `src/components/PostAircraftForm.tsx` — the only file changed.
  - Import `SEO_MAKE_MODELS` from `@/lib/seo` (the existing curated make/model table —
    **no new or fabricated data**; tree-shaken to just the array literal).
  - Mirror the uncontrolled Make `<select>` value into React state via an `onChange`
    (keep it uncontrolled so the existing FAA / AI DOM-dispatch autofill still works).
  - Render a `<datalist>` of model names filtered by the selected make; wire it to the
    Model `<input>` via `list=`. Add a subtle one-line hint so the affordance is
    discoverable.

## Acceptance criteria
1. With a Make selected (e.g. Cessna), focusing/typing in the Model field surfaces curated
   model suggestions for that make (e.g. 172, 182, 150, 180, 206, 210).
2. The Model field still accepts **free text** — suggestions never block a custom value
   (no data-integrity / friction regression); the field stays `required`.
3. FAA N-number lookup and AI "Prefill from notes" still set Make + Model correctly
   (the make-select autofill path is unbroken), and the model suggestions follow the
   autofilled make.
4. `npx next build` + typecheck pass.
5. QA smoke (`/aircraft/new`, desktop 1280 + mobile 375) is green: HTTP 200, zero
   app-origin console errors, zero horizontal overflow.
6. Screenshots: the form renders correctly with the new Model hint and no layout breakage.

## Out of scope
- No changes to the server action, validation, DB schema, or required-field set.
- No make→model *enforcement* (still free text); no model autocomplete network calls.
- No changes to the partnership/seeker post forms (parity is a possible follow-up).
- No changes to `/auth`, FAA route, or the curated SEO data itself.
