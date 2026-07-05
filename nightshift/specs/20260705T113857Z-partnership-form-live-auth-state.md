# partnership-form-live-auth-state

**Goal:** Give `PostPartnershipForm.tsx` the same live client-side auth-state listener
`PostAircraftForm.tsx` got in `aircraft-form-live-auth-state` (2026-07-05), so a session
that expires/changes while the partnership post/edit form is open no longer leaves the
submit/AI-draft/photo-upload auth gates silently stale.

**Scope:**
- `src/components/PostPartnershipForm.tsx` only.
- Rename the destructured `isLoggedIn` prop to `isLoggedInProp` (default `true`), add a
  local `isLoggedIn` state seeded from it, and sync it via `supabase.auth.getUser()` +
  `onAuthStateChange` in a mount-effect — identical shape to `PostAircraftForm.tsx`'s
  existing block (same `createClient` import from `@/lib/supabase`).
- No change to any other logic, markup, or prop signature — `isLoggedIn` (the variable
  name used throughout the rest of the component body) keeps working unchanged since only
  its source becomes live instead of static.

**Acceptance criteria:**
1. `PostPartnershipForm` seeds live `isLoggedIn` state from the SSR `isLoggedInProp` and
   updates it on `supabase.auth.onAuthStateChange`, mirroring `PostAircraftForm.tsx`.
2. The listener unsubscribes on unmount (no leaked subscription).
3. Every existing use of `isLoggedIn` in the component (submit gate, AI-draft gate, photo
   uploader prop, button label, contact-name hint) is unaffected — same behavior when the
   session is stable.
4. `npx next build` passes with no new type errors.
5. QA smoke passes (HTTP 200, zero console errors, zero horizontal overflow) on
   `/partnerships/new` and a live partnership `/edit` page at desktop 1280 + mobile 375.

**Out of scope:**
- `PostSeekerListingForm.tsx` (slice 3, same gap — a future cycle).
- Any visual/markup change — this is a state-source change only, no new UI.
- Live-driving an actual sign-out-mid-edit repro in this sandbox (no real session to
  invalidate) — same honestly-flagged limitation as the aircraft-form slice.
