# Spec: seeking-drive-time

**UTC:** 2026-06-25T09:55:42Z  
**Slug:** seeking-drive-time  
**Lane:** [P1][want]

## Goal
Change the "Willing to Travel" field on the seeking post form from raw nautical-mile distances to familiar drive-time options — pilots think in drive time, not nm.

## Scope
Three files:
- `src/components/PostSeekerListingForm.tsx` — change field label, helper text, and option values/labels
- `src/components/SeekerCard.tsx` — display drive-time equivalent instead of raw nm
- `src/app/partnerships/seeking/[id]/page.tsx` — display drive-time equivalent instead of raw nm

## Acceptance criteria
1. The seeking post form's "Willing to Travel" field is renamed "Max commute distance" (or similar) and shows drive-time options: "~30 min drive", "~45 min drive", "~1 hr drive", "~1.5 hr drive", "~2+ hr drive".
2. The option VALUES stored in the DB (via `willing_to_travel_nm`) are nm equivalents of the drive times — no schema change.
3. SeekerCard displays the drive-time label (e.g. "~30 min commute") instead of raw nm.
4. Seeker detail page displays the drive-time label instead of raw nm.
5. `npx next build` passes clean.
6. Smoke: HTTP 200, zero app-origin console errors, zero horizontal overflow on `/partnerships/seeking` and `/partnerships/seeking/new` at 1280 + 375px.

## Out of scope
- Multiple base airports (separate slice, may need schema)
- SeekerFilters distance filter (internal browse filter — nm is fine there)
- Schema changes of any kind
