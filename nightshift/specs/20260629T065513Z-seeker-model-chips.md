# Spec: seeker-model-chips
**Timestamp:** 2026-06-29T065513Z

## Goal
Add one-tap model chips to the "Preferred Models" field on the seeker posting form, removing the recall + typing friction of a free-text-only field.

## Scope
- `src/components/PostSeekerListingForm.tsx` — add `PREFERRED_MODEL_CHIPS` constant, `preferredModels` mirror state, mount sync, `togglePreferredModel` handler, chips row above the `preferred_models` input, `onChange` mirror on the input, and clear in `handleStartOver`.

No other files touched. No schema change, no server action change, no new utilities (reuses `hasCsvItem`/`toggleCsvItem` from `src/lib/csvList.ts` already imported).

## Acceptance criteria
1. 9 model chips (172, 182, SR22, SR20, Cherokee, Arrow, M20, Bonanza, DA40) appear above the "Preferred Models" text input in the "More details" section of `/partnerships/seeking/new`.
2. Tapping a chip toggles the model in the comma-separated field value; active chips light up in sky-blue — exact visual pattern as make/ratings chips.
3. Typing in the text box keeps chip highlights in sync (onChange mirrors to `preferredModels` state).
4. AI "Prefill from your notes" fills `preferred_models` via `fillFormField` (dispatches `input`) — chip highlights update automatically because the onChange fires.
5. Draft restore on mount syncs chip highlights (same `useEffect` pattern as makes/ratings).
6. "Start over" clears chip highlights (`setPreferredModels('')` in `handleStartOver`).
7. No horizontal overflow at desktop 1280 + mobile 375. Chips wrap naturally on mobile.

## Out of scope
- Filtering model chips by selected makes (chips are make-agnostic — show all 9 regardless).
- Adding chips to the aircraft or partnership post forms (different forms, different cycle).
- Any server action, DB column, or schema change.
- Any change to the partnership or aircraft post forms.
