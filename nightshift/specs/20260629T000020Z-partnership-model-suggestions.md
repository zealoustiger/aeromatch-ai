# partnership-model-suggestions

## Goal
Cut recall friction on the partnership post form by giving its **Model** field the same
curated, make-aware autocomplete the aircraft post form already has — so a seller picks a
common model for their chosen make instead of recalling the exact canonical string.

## Pillar
Frictionless listing posting (Pillar 1). Mirrors the `aircraft-model-suggestions` cycle on
a different posting surface (`/partnerships/new`), which had been left with a plain free-text
Model field. Keeps make/model values consistent for partnership comp / market-check queries.

## Scope (small)
- `src/components/PostPartnershipForm.tsx` only.
  - Import `SEO_MAKE_MODELS` from `@/lib/seo`; build the same `normMake` + `MODELS_BY_MAKE`
    map + `ALL_MODELS` fallback the aircraft form uses (curated data, no fabrication).
  - Track the selected make in state (the Make `<select>` is uncontrolled and gets set by
    FAA/AI autofill via a dispatched `change` event — wire `onChange` + a mount-sync effect
    so suggestions follow autofill, exactly like the aircraft form).
  - Attach a `<datalist>` of the picked make's models to the Model `<input>` (`list=`,
    `autoComplete="off"`), with a small helper line. Free text still allowed.

## Acceptance criteria
- Picking a Make (e.g. Cessna) makes the Model field suggest that make's curated models
  (172, 182, …); typing still accepts any free-text model.
- N-number / AI autofill that sets the Make also updates which models are suggested (the
  dispatched `change` event drives the same state).
- Model field remains `required`; no change to the server action, validation, or data model.
- `npx next build` + typecheck pass; QA smoke (HTTP 200 / no app console errors / no
  horizontal overflow) passes at 1280 + 375 on `/partnerships/new`.

## Out of scope
- No change to the aircraft or seeker forms, the FAA route, or `actions.ts`.
- No new model data — only the existing curated `SEO_MAKE_MODELS` table.
- Not fixing the partnership/seeker "Start over" in-flight autofill race (separate item).
