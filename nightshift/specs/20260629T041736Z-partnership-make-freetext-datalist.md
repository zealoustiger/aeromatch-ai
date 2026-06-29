# Partnership post form — free-text Make field with datalist

**Slug:** `partnership-make-freetext-datalist`
**Pillar:** 1 — Frictionless listing posting (rotation: last cycle was Pillar 3; Pillar 2's
headline items remain human-blocked behind the frozen `/auth`).

## Goal
Bring the partnership post form's **Make** field to parity with the aircraft form: replace
the constrained `<select>` (which coerces any non-listed make to "Other" — a dead-end that
loses the real make and breaks buyer-side make/model family matching) with a free-text
`<input>` + datalist of common makes, exactly mirroring the already-shipped, already-QA'd
`aircraft-make-freetext-datalist` pattern.

## Why (friction + data integrity)
- A seller of a Maule / Aviat / Bellanca / Husky etc. currently has to pick "Other," which
  never matches `resolveMakeModelFamily` (a lowercased substring match) — so their listing
  is excluded from the comp set / family pages. Free text fixes both the friction and the
  silent data-integrity loss.
- It also deletes the `fillMakeSelect` option-injection hack (a workaround for the very
  `<select>` limitation we're removing): FAA-lookup and AI-prefill makes now fill via the
  shared `fillFormField`, the same path the aircraft form uses.

## Scope (one file)
- `src/components/PostPartnershipForm.tsx`
  - Drop `'Other'` from `MAKES`; add a `MAKE_SUGGESTIONS` dedup-union (MAKES ∪ distinct
    `SEO_MAKE_MODELS` makes, canonical spelling wins) — identical to the aircraft form.
  - Replace the Make `<Select>` with a free-text `<Input>` + `<datalist id="partnership-make-suggestions">`,
    keeping `required`, `autoComplete="off"`, and `onChange={(e) => setSelectedMake(e.target.value)}`.
  - Remove `fillMakeSelect`; route the FAA-lookup (line ~229) and AI-prefill (line ~293)
    make fills through the existing `fillFormField(form, '[name="make"]', make)`.
  - Update the on-mount make-sync `useEffect` to query an `HTMLInputElement`.
  - Update stale comments that reference the `<select>` / `fillMakeSelect`.
- Keep the `Select` component (still used for `share_type` and `contact_method`).

## Acceptance criteria
- [ ] `npx next build` + typecheck pass (no unused `fillMakeSelect`, no type errors).
- [ ] `/partnerships/new` renders; Make is a text input with a datalist of common makes;
      typing a non-listed make (e.g. "Maule") is preserved (not coerced to "Other").
- [ ] FAA "Look up →" and AI "Prefill from your notes" both still fill Make (verified by code
      path: both now call `fillFormField` on `[name="make"]`), and the Model datalist still
      narrows to the filled make via `selectedMake`.
- [ ] QA smoke (`/partnerships/new`) exits 0: HTTP 200, no app-origin console errors, no
      horizontal overflow at 1280 + 375.
- [ ] Screenshots show the Make field rendering correctly alongside Model (visual cycle).

## Out of scope
- The aircraft and seeker forms (aircraft already done; seeker has no make `<select>`).
- The AI-draft JSON schema enum in `actions.ts` (a generation constraint, not the user input;
  unchanged — matches the aircraft form's already-shipped behavior).
- Any server-action / DB / data-model change.
