# aircraft-description-help

## Goal
Port the seeker form's "how to write a great description" tips + example box onto the aircraft-for-sale post form, closing a Pillar 1 (frictionless posting) parity gap: the exact friction-reducer (removing "blank page, what do I write" hesitation) exists on `/partnerships/seeking/new` but not on `/aircraft/new`, even though the aircraft form's own copy says the description is "the single biggest factor in getting a serious inquiry."

## Scope
- `src/components/PostAircraftForm.tsx` only:
  - Add a `DESCRIPTION_TIPS` array (4 short bullets tailored to an aircraft-for-sale listing: specs/condition, maintenance/annual status, why selling, what makes it stand out).
  - Add a `DESCRIPTION_EXAMPLES` array (2 short example descriptions, aircraft-flavored).
  - Render the same collapsible `sky-50` tips box (bulleted tips + `<details>`/`<summary>` toggle revealing the two examples) directly above the existing description `<textarea>` in the "About this aircraft" section, mirroring `PostSeekerListingForm.tsx`'s markup/classes exactly.
- No changes to `actions.ts`, no schema changes, no changes to required fields/validation.
- Partnership form (`PostPartnershipForm.tsx`) gets the same treatment as a likely next slice — explicitly out of scope this cycle to keep the change small and reviewable.

## Acceptance criteria
- `/aircraft/new` renders a "How to write a great description" tips box above the description textarea, matching the seeker form's visual style (sky-tinted box, bullet tips, collapsible examples).
- The `<details>` toggle expands/collapses two example descriptions without a page reload or console error.
- No existing field, validation, or submit behavior on the aircraft form changes.
- `npx next build` + typecheck pass.
- QA smoke passes (HTTP 200, no console errors, no horizontal overflow) at desktop 1280 + mobile 375 on `/aircraft/new` (and the edit route, since it shares the component).
- Visually confirmed via screenshot: the new box renders cleanly, no overlap with the textarea or surrounding sections, at both viewports.

## Out of scope
- Partnership form's description box (separate follow-on slice).
- Any change to the description placeholder text, textarea size, or required-ness.
- Any AI-draft/actions.ts change.
