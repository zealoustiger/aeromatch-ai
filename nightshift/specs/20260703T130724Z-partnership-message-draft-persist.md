# partnership-message-draft-persist

## Goal
Extend the message-draft-persist fix (already shipped for aircraft-for-sale and
seeker listings) to partnership listings' contact surfaces, so a logged-out
visitor's typed message to a partnership owner survives the sign-in redirect
instead of vanishing.

## Scope
- `src/components/ContactBar.tsx` (mobile sticky bar, `/partnerships/[id]`) —
  replace the plain "Message"/"Message {firstName}" button with an inline
  compose box (textarea + send), matching `AircraftContactButton`/
  `SeekerContactBar`. Owns the existing auto-open-on-return `?contact=1`
  effect; extend it to also send a persisted draft via `sendMessage` +
  `clearMessageDraft`, same shape as the aircraft/seeker versions.
- `src/components/ContactButtons.tsx` (desktop sidebar, same page) — same
  inline compose box. Does NOT duplicate the auto-open-on-return effect
  (ContactBar already owns that single trigger, per its existing comment) —
  only saves the draft + redirects on send-while-logged-out.
- Both share draft key `partnership:${listingId}` via the existing
  `src/lib/messageDraft.ts` helper (no changes needed there).
- Keep existing email/phone buttons and the seed-persona label behavior
  (`isSeed`/`firstName`) in `ContactBar` unchanged.

## Acceptance criteria
- On `/partnerships/[id]`, clicking "Message"/"Message {name}" (mobile bar or
  desktop sidebar) expands an inline textarea + send button instead of
  redirecting immediately.
- Logged out: typing a message and hitting send saves the draft to
  localStorage and redirects to `/auth?next=/partnerships/[id]?contact=1`.
- After signing in and returning, the thread opens, the drafted message is
  sent automatically, and the draft is cleared — no retyping.
- Logged in: hitting send creates/opens the thread and sends the message in
  one step (no redirect).
- Empty/whitespace-only text cannot be sent (button disabled).
- No new console errors on `/partnerships/[id]` at desktop 1280 + mobile 375.

## Out of scope
- `MessageOwnerButton.tsx` (member-profile / seed-persona desktop surface) —
  left for a follow-up slice, same as prior cycles' scoping.
- Any change to `/auth`, Supabase auth config, or `messageDraft.ts` itself.
- Aircraft/seeker contact flows (already shipped).
