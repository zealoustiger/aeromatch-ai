# seeker-remove-scheduling-field

## Goal
Remove the "Preferred Scheduling" free-text field from the pilot-seeking post/edit
form — one fewer decision between "I want to post" and "it's published" — closing
the last unshipped sub-item of BACKLOG.md's `[P1][goal]` "Post-a-Seeking form: make
it frictionless" (item 3: "remove 'preferred scheduling system'"; items 1/2/4/5 of
that slice are already shipped).

## Scope
- `src/components/PostSeekerListingForm.tsx` — remove the "Preferred Scheduling"
  `Label`+`Input` block and the `preferred_scheduling` prop from `initialValues`;
  drop it from the `hasOptional`/`open` auto-expand check.
- `src/app/actions.ts` — remove `preferred_scheduling` extraction from both
  `createSeekerListing` and `updateSeekerListing`.
- `src/lib/types.ts` — remove `preferred_scheduling` from the `Seeker` type.
- `src/lib/mockData.ts` — remove the 3 `preferred_scheduling` fixture fields.
- `src/app/partnerships/seeking/[id]/page.tsx` — remove the "Preferred scheduling"
  `dt`/`dd` display block.
- `src/app/partnerships/seeking/[id]/edit/page.tsx` — remove `preferred_scheduling`
  from the `.select()` column list and the `initialValues` mapping.
- No schema change — `partnership_seekers.preferred_scheduling` (native column,
  `supabase/schema.sql:223`) is left in place untouched; the app just stops
  reading/writing it. Not destructive SQL, no migration needed.

## Acceptance criteria
- [ ] `/partnerships/seeking/new` no longer shows a "Preferred Scheduling" field.
- [ ] `/partnerships/seeking/[id]/edit` no longer shows it either.
- [ ] A seeker listing detail page (`/partnerships/seeking/[id]`) no longer renders
      a "Preferred scheduling" row (existing rows with old data simply stop
      displaying it — no crash, no fabricated value).
- [ ] `npx next build` + `npx tsc --noEmit` pass clean (no leftover references).
- [ ] QA smoke passes (HTTP 200 / no console errors / no horizontal overflow) at
      desktop 1280 + mobile 375 on `/partnerships/seeking/new` and a real
      `/partnerships/seeking/[id]` detail page.

## Out of scope
- Not touching any other field on the seeker form.
- Not dropping the DB column (additive-only policy; unused column is harmless).
- Not touching the aircraft or partnership post forms.
