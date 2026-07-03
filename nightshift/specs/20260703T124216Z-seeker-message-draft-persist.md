# seeker-message-draft-persist

## Goal
Give the seeker-listing contact card (`SeekerContactBar`) the same inline
compose + pre-auth message-draft persistence that aircraft listings already
have, so a logged-out visitor's typed message to a pilot-seeking-a-partnership
poster survives the sign-in redirect instead of vanishing.

## Scope
- `src/components/SeekerContactBar.tsx` — replace the plain "Sign in to
  contact this pilot" / "Send Message" buttons with an inline compose
  textarea + send button (mirrors `AircraftContactButton.tsx`): typing while
  logged out saves the draft to `localStorage` (via the existing generic
  `src/lib/messageDraft.ts`, keyed `seeker:<seekerId>`) and redirects to
  `/auth?next=...&contact=1`; returning with `?contact=1` auto-opens (or
  creates) the thread via the existing `getOrCreateSeekerThread` and
  auto-sends the drafted message via the existing `sendMessage`, then clears
  the draft.
- No server action changes — `getOrCreateSeekerThread` and `sendMessage`
  already exist and are reused as-is.
- No schema changes.

## Acceptance criteria
- Logged-out visitor on `/partnerships/seeking/[id]`: clicking the contact
  affordance reveals a textarea; typing text and submitting saves the draft
  to `localStorage` under a seeker-scoped key and redirects to
  `/auth?next=<seekerPath>?contact=1`.
- Returning signed-in with `?contact=1` present: the thread is created/opened
  via `getOrCreateSeekerThread`, the saved draft is sent via `sendMessage`,
  the draft is cleared, and the visitor lands on `/messages/[threadId]`.
- Already-signed-in visitor: submitting the textarea sends immediately
  (no redirect) via the same thread-then-send path.
- The listing owner still sees no message-send affordance (unchanged
  owner-view guard).
- Email/phone contact methods on `SeekerContactBar` are unaffected.
- `npx next build` + `npx tsc --noEmit` pass; QA smoke passes (HTTP 200, zero
  console errors, zero horizontal overflow) at desktop 1280 + mobile 375 on
  `/partnerships/seeking/[id]`.

## Out of scope
- `ContactBar.tsx` / `ContactButtons.tsx` (partnership listing) and
  `MessageOwnerButton.tsx` (member profile / seed persona) — same gap, left
  as a follow-up slice (noted in CHANGELOG `Next:`).
- Any change to `/auth`, Supabase auth, or the `threads`/`messages` schema.
