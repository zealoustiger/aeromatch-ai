# partnership-description-help

## Goal
Add the same "How to write a great description" tips box + example descriptions to the partnership post form (`PostPartnershipForm.tsx`) that already exists on the aircraft and seeker forms, closing the last remaining Pillar 1 (frictionless posting) parity gap noted in BACKLOG.md.

## Scope
- `src/components/PostPartnershipForm.tsx` only:
  - Add a `DESCRIPTION_TIPS` array (partnership-flavored: aircraft/group basics, scheduling system, what kind of partner they're looking for, cost/reserve transparency).
  - Add a `DESCRIPTION_EXAMPLES` array (2 example partnership descriptions, in the same "well-equipped" / "budget-friendly" style split as the aircraft form, or an analogous split for partnerships e.g. "established group with an opening" / "new partnership forming").
  - Insert the collapsible tips box (identical markup/classes to `PostAircraftForm.tsx`'s `<details>`/tips block) into the existing "About this partnership" section (around line 627-638), directly above the `<textarea name="description">`.
- No changes to `src/app/actions.ts`, no schema change, no changes to required fields.

## Acceptance criteria
- `/partnerships/new` and `/partnerships/[id]/edit` (same form component) show a sky-tinted tips box above the description textarea with 4 bullet tips.
- A "See two example descriptions" `<details>` toggle reveals two example partnership descriptions; toggle also collapses back ("Hide examples").
- Visual style (colors, spacing, typography) matches the existing aircraft-form tips box exactly (same Tailwind classes) for consistency.
- No new required fields; description remains optional exactly as before.
- `npx next build` compiles clean, no TypeScript errors.
- QA smoke passes on `/partnerships/new` at desktop 1280 + mobile 375 (HTTP 200, no console errors, no horizontal overflow).

## Out of scope
- Any change to the seeker or aircraft forms (already shipped).
- Any change to AI-draft extraction, server actions, or the description field's validation/required-ness.
- Any change to other sections of the partnership form.
