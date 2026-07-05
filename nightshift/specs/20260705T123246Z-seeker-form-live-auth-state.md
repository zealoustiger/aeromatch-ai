# seeker-form-live-auth-state

## Goal
Give `PostSeekerListingForm.tsx` the same live client-side auth-state listener that
`PostAircraftForm.tsx` and `PostPartnershipForm.tsx` already have, so a session that
expires/changes while the "post/edit a seeking listing" form is open still correctly
flips the submit/AI-draft auth gates instead of leaving them stale and surfacing a raw
401. This is explicitly-flagged slice 3 of the Pillar 2 (signup/auth) gap first noted
in `aircraft-form-live-auth-state` (2026-07-05) and completed for partnerships in
`partnership-form-live-auth-state` (2026-07-05) — this closes it for all 3 post forms.

## Scope
- `src/components/PostSeekerListingForm.tsx` only:
  - Rename the destructured `isLoggedIn` prop to `isLoggedInProp`.
  - Add live `isLoggedIn` state seeded from `isLoggedInProp`, kept current via
    `supabase.auth.getUser()` + `onAuthStateChange` (import `createClient` from
    `@/lib/supabase`) — byte-for-byte the same pattern as `PostPartnershipForm.tsx`.
  - Every existing use of `isLoggedIn` in the component (submit gate, AI-draft gate,
    button label, contact-name hint) is untouched — only its source becomes live.
- No other file changes. No schema change. `src/app/auth/**` and `src/lib/supabase*.ts`
  are not modified (only imported), consistent with FREEZE.md.

## Acceptance criteria
- `PostSeekerListingForm` seeds `isLoggedIn` from the SSR prop on first render (stable
  session path unchanged — logged-out `/partnerships/seeking/new` still shows the
  "Sign in to Publish" gate immediately).
- `isLoggedIn` state updates on `onAuthStateChange` events, mirroring `Nav.tsx` /
  `PostAircraftForm.tsx` / `PostPartnershipForm.tsx`.
- `npx next build` + typecheck pass clean.
- QA smoke (`qa-smoke.mjs`) passes on `/partnerships/seeking/new` and a real seeker
  listing's `/partnerships/seeking/[id]/edit` page at desktop 1280 + mobile 375 — HTTP
  200, zero app-origin console errors, zero horizontal overflow.
- No visible UI/behavior change on the stable-session path (this is a non-visual,
  logic-only cycle).

## Out of scope
- Driving a real mid-session sign-out repro live (no seeded auth session available in
  this sandbox to invalidate mid-form, same honestly-flagged limitation as the two
  prior slices).
- Any other Pillar 2/1/3 items.
