# edit-listing-session-expiry-redirect

## Goal
When a signed-in user's session has expired by the time they submit an edit to
one of their listings, redirect them to `/auth?next=<edit-page>` (like the
create-listing actions already do) instead of throwing a bare, dead-end error —
so they can sign back in and land right back on the edit form, which autosaves
their in-progress changes to localStorage anyway.

## Scope
- `src/app/actions.ts`:
  - `updatePartnershipListing(id, formData)` — `throw new Error('Not authenticated')`
    → `redirect(\`/auth?next=/partnerships/${id}/edit\`)`
  - `updateSeekerListing(id, formData)` — same → `redirect(\`/auth?next=/partnerships/seeking/${id}/edit\`)`
  - `updateAircraftListing(id, formData)` — same → `redirect(\`/auth?next=/aircraft/listing/${id}/edit\`)`
- No other files. No schema change.

## Why this is real (not gamed)
The edit *pages* already gate on page-load (`if (!user) redirect('/auth?next=...')`
in each `edit/page.tsx`) — so a fully logged-out visitor never even reaches the
form. But the server *actions* behind the submit button re-check auth themselves
(defense in depth against a session expiring between page load and submit, which
is realistic for these long multi-field forms) and today just `throw`, which the
client `useActionState` handler catches and renders as a plain inline error
message — no path back, no redirect, intent dropped. The sibling `create*`
actions already redirect with `?next=` in this exact situation
(`createPartnership`/`createSeekerListing`/`createAircraftListing`, `actions.ts`
lines 70/366/603) — this brings the three `update*` actions to parity.
No new replay logic is needed: each edit form already autosaves every keystroke
to a per-listing localStorage draft key (`useFormDraft`), so the in-progress edit
restores automatically once the user is redirected back after signing in.

## Acceptance criteria
- `updatePartnershipListing`, `updateSeekerListing`, `updateAircraftListing` each
  redirect to `/auth?next=<their own edit route>` instead of throwing when
  `user` is null.
- `npx tsc --noEmit` and `npx next build` both pass.
- QA smoke passes (HTTP 200, zero app-origin console errors, zero horizontal
  overflow) on `/partnerships/[id]/edit`, `/partnerships/seeking/[id]/edit`,
  `/aircraft/listing/[id]/edit` at desktop 1280 + mobile 375 — these routes
  already redirect a logged-out visitor at page-load, so the smoke test mainly
  re-confirms no regression to that existing gate.
- No behavior change for a normally-authenticated edit submit (still updates
  the row exactly as before).

## Out of scope
- Any change to `src/app/auth/**`, `supabase-server.ts`, or `supabase.ts` (frozen).
- Any change to the page-load gates in the three `edit/page.tsx` files (already correct).
- Adding a toast/banner explaining "your session expired" — the redirect + draft
  restore is enough signal for this cycle; a message can be a future polish slice.
