# partnership-edit-placeholder-reset

## Goal
Fix `updatePartnershipListing` so removing all photos on an edit correctly resets `image_is_placeholder` back to `true`, instead of leaving it `false` forever once any photo was ever uploaded.

## Scope
- `src/app/actions.ts` — `updatePartnershipListing`'s `basePayload` (currently only sets `image_is_placeholder: false` when `photoUrls.length > 0`, and never sets it back to `true` when a poster clears all photos).
- Match the already-correct pattern used by `updateAircraftListing` (`image_is_placeholder: photoUrls.length === 0`, set unconditionally alongside `images`).

## Acceptance criteria
- `updatePartnershipListing`'s payload always includes `image_is_placeholder: photoUrls.length === 0` (not conditional), same as `updateAircraftListing`.
- Editing a partnership listing that has photos and removing all of them sets `image_is_placeholder` back to `true` in the DB.
- Editing a partnership listing to add photos (from none) still sets `image_is_placeholder` to `false`, as before — no regression.
- `npx tsc --noEmit` and `npx next build` both pass clean.
- QA smoke passes (HTTP 200, zero console errors, zero horizontal overflow) on `/partnerships/[id]/edit` and `/partnerships/[id]` at desktop 1280 + mobile 375.
- No schema change, no new UI — pure server-action logic fix.

## Out of scope
- `createPartnership` (insert path) is unaffected — it correctly relies on the DB default (`true`) when no photos are supplied, since there's no prior state to reset.
- The seeker/aircraft forms are not touched — `updateAircraftListing` already has correct behavior; seeker listings don't have an `image_is_placeholder` field.
- No changes to `getSeekerBudgetCheck`'s same-make-only comp gap or any other backlog item noted in prior cycles.
