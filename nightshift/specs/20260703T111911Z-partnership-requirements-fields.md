# partnership-requirements-fields

## Goal
Stop the partnership post/edit form from silently nulling out `min_hours`, `ratings_required`, and `scheduling_system` on every save, by finally giving posters a way to set them (they're already collected server-side and rendered to buyers, but no form has ever had inputs for them).

## Why (bug found this cycle)
`src/app/actions.ts` (`createPartnership` line 107-109, `updatePartnershipListing` line 198-200) always writes `min_hours`, `ratings_required`, `scheduling_system` from `formData`, but `PostPartnershipForm.tsx` has no inputs named any of these — so every create sets them to `null`, and critically **every edit save silently overwrites any existing value back to `null`** (no "only touch if resupplied" guard, unlike `updateAircraftListing`'s home_airport handling). Yet these fields are actively displayed to buyers: `PartnershipCard.tsx:197-206` (footer chips), `partnerships/[id]/page.tsx:458-474` (Pilot Requirements panel) and `:615-618` (Scheduling row), `compare/page.tsx:80` (comparison table). This is a real data-integrity gap under GOAL.md's posting-friction guardrail ("cutting a required field is good; silently publishing/erasing data is not").

## Scope (files touched)
- `src/components/PostPartnershipForm.tsx` — add a "Partner requirements" subsection inside the existing "More details" `<details>`: Min hours (optional number input, name `min_hours`), Ratings required (chip toggles reusing the seeker form's `RATINGS_CHIPS` set + `hasCsvItem`/`toggleCsvItem` from `@/lib/csvList`, name `ratings_required`), Scheduling system (optional free-text input, name `scheduling_system`, e.g. "FlyingClub, Google Calendar"). Wire into `PartnershipEditInitial`, the details-auto-open condition, and the "Start over"/"Revert changes" reset mirror-state handling (same pattern as the seeker form's `ratings_held`).
- `src/app/partnerships/[id]/edit/page.tsx` — add `min_hours, ratings_required, scheduling_system` to the Supabase `select()` and pass them into `initialValues` (ratings_required joined to a comma string, matching how `ratings_held` is passed in the seeker edit page).

## Out of scope
- No AI-draft extraction of these fields this cycle (the AI schema already omits them; leaving as-is).
- No schema change — the three columns already exist and are already read/written by `actions.ts`.
- No change to the seeker form or aircraft-for-sale form.
- No dedupe/normalization of the `ratings_required` chip set vs the seeker form's `RATINGS_CHIPS` beyond reusing the same constant.

## Acceptance criteria
- [ ] `/partnerships/new` shows a "Partner requirements" block (Min hours / Ratings required chips / Scheduling system) inside "More details"; all three fields are optional (no `required` attr).
- [ ] Submitting the create form with these fields set produces a listing whose card/detail page renders them (existing display code, no changes needed there).
- [ ] `/partnerships/[id]/edit` for a listing that already has `min_hours`/`ratings_required`/`scheduling_system` set pre-fills those three fields, and saving with them unchanged does NOT null them out (the exact bug this fixes).
- [ ] Chip toggle behavior matches the seeker form's ratings chips (click to add/remove, free-text fallback input still works, comma-separated).
- [ ] `npx next build` + typecheck green.
- [ ] QA smoke passes on `/partnerships/new` and `/partnerships/[id]/edit` (desktop 1280 + mobile 375), no new console errors, no horizontal overflow.
