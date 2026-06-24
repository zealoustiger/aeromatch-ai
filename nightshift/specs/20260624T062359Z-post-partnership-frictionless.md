# Post-a-partnership: make posting frictionless — slice 1 (field changes)

**Lane:** [want] (last non-bug cycle `home-for-sale-by-state` pulled [goal]; last cycle PASS → no blocker → [want] owed per the 1:1).
**Backlog item:** `[P1][want] Post-a-partnership form: make posting frictionless` — slice (1) field changes 1–5.

## Goal
Make posting an aircraft partnership lower-friction by trimming and reordering the
form so an owner types only what matters, while preserving the location data the
state SEO pages depend on (derive it from the ICAO instead of asking for it).

## Scope (small)
- `src/components/PostPartnershipForm.tsx` — the form fields/sections.
- `src/app/actions.ts` (`createPartnership`) — derive airport_name/city/state from
  the home-airport ICAO via the `airports` table instead of reading dropped fields.

## Changes (the human's list 1–5)
1. **N-number optional** with helper text (it's already non-required; add the helper).
2. **Simplify "Home Airport"** to just the ICAO identifier — drop the Airport Name,
   City, and State inputs (location is implied by / derived from the ICAO).
3. **Buy-in required**; Monthly Fixed + Wet Rate **optional** with an **info hover**
   explaining partnerships are structured different ways (leave blank if N/A).
4. **Remove the Pilot Requirements** section (Minimum Hours + Required Ratings).
5. **Move "Listing Details"** (Title + Description) earlier — to the 2nd section.

## Acceptance criteria
- `/partnerships/new` renders (HTTP 200) with no app-origin console errors and no
  horizontal overflow at desktop 1280 + mobile 375.
- The Home Airport section shows **only** the ICAO field (no Airport Name / City /
  State inputs).
- The **Pilot Requirements** section is gone.
- **Listing Details** (Title/Description) is the **2nd** section, right after Aircraft Details.
- **Buy-In Price** is marked required (red asterisk); Monthly Fixed + Wet Rate stay
  optional and carry an **info hover** explaining structures vary / leave blank if N/A.
- The **N-Number** field shows an "optional" helper line.
- `createPartnership` derives airport_name/city/state from the ICAO (so the
  `/partnerships/state/[state]` SEO pages keep getting correct location data);
  `next build` + typecheck pass.

## Out of scope
- Slice 2 (autosave + Saving…/Saved indicator) and slice 3 (375px micro-polish).
- The seeking-form friction pass (separate backlog item) and the post-type toggle.
- Any schema change (additive or otherwise) — uses existing columns only.
- Multi-photo upload (separate backlog item).
