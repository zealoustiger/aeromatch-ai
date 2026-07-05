# seeker-post-analytics-parity

## Goal
Make the pilots-seeking-a-partnership posting funnel measurable by firing a submission
(and edit) analytics event on the seeker post form, exactly as the aircraft-for-sale and
partnership post forms already do — so the seeker slice of the frictionless-posting pillar
can be judged by PostHog activation events instead of being completely dark.

## Why (Pillar 1 — frictionless posting)
GOAL.md's honesty rule says to judge a cycle by leading indicators, explicitly naming the
PostHog `seeker_posted` conversion. Today `PostSeekerListingForm` fires **no** `track()` call
at all on submit or edit, while `PostAircraftForm` fires `aircraft_listing_submitted` /
`aircraft_listing_edited` and `PostPartnershipForm` fires `listing_submitted` /
`partnership_listing_edited`. The seeker posting funnel is therefore invisible in analytics —
an objective 0-vs-2 instrumentation parity gap. Instrumenting it lets the seeker posting
pillar's success actually be observed.

## Scope (small, single file)
- `src/components/PostSeekerListingForm.tsx` only:
  - Import `track` from `@/lib/analytics` (currently not imported).
  - In the `useActionState` submit reducer, add `track('seeker_listing_edited', {...})` in the
    edit branch and `track('seeker_listing_submitted', {...})` in the create branch, mirroring
    the exact placement (just before the server action call) and prop shape of `PostAircraftForm`.
  - Submit props: honest, present FormData fields only — `home_airport` (the one required
    field) and `preferred_makes`. Edit props: `listing_id`.

## Acceptance criteria
- `PostSeekerListingForm` imports and calls `track` on both the create and edit submit paths.
- Event names follow the existing type-prefixed convention: `seeker_listing_submitted` /
  `seeker_listing_edited`.
- Props reference only real seeker FormData fields (no fabricated/absent fields).
- `npx next build` + typecheck pass.
- QA smoke passes (HTTP 200, no app-origin console errors, no horizontal overflow) at desktop
  1280 + mobile 375 on `/partnerships/seeking/new`.
- No change to the aircraft or partnership forms, no schema change, no auth-file change.

## Out of scope
- No server-side tracking, no new PostHog dashboards.
- No change to the aircraft/partnership forms' existing (differently-named) events.
- No visual/copy changes to the seeker form.
- No renaming of the existing aircraft/partnership event names for consistency (would be a
  separate, riskier change touching working analytics).
