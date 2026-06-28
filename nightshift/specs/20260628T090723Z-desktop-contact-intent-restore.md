# desktop-contact-intent-restore

## Goal
Preserve "message the owner" intent across the auth redirect for the two desktop
partnership contact components the previous `contact-intent-restore` cycle missed
(`MessageOwnerButton`, `ContactButtons`), so a logged-out visitor who clicks
"Message" → signs in lands directly in the thread instead of back on the listing
having to click again.

## Background
`contact-intent-restore` (2026-06-28T072419Z) added `?contact=1` intent encoding +
an auto-open `useEffect` to `ContactBar`, `SeekerContactBar`, and
`AircraftContactButton`. It did NOT touch the two **desktop** partnership contact
components:
- `MessageOwnerButton` (seed-persona desktop card; also used on `/members/[id]`)
- `ContactButtons` (real-listing desktop card)
Both still redirect to `/auth?next=<listingPath>` with no `?contact=1`, so intent
is dropped after sign-in on the desktop surface.

## Scope (small)
- `src/components/ContactButtons.tsx` — append `?contact=1` to the unauthenticated
  `/auth?next=` redirect. It is only rendered on `/partnerships/[id]`, where
  `ContactBar` is always mounted and already auto-opens on `?contact=1`; rely on
  that single trigger (no own trigger → no double getOrCreateThread call).
- `src/components/MessageOwnerButton.tsx` — append `?contact=1` to the redirect;
  add an **opt-in** `autoContactOnReturn?: boolean` prop that, when set, mounts a
  self-contained auto-open `useEffect` (mirrors ContactBar's). Needed because
  `MessageOwnerButton` is also used on `/members/[id]`, which has **no** ContactBar.
- `src/app/members/[id]/page.tsx` — pass `autoContactOnReturn` to the
  `MessageOwnerButton` on the member page.

## Why opt-in (not always-on) auto-trigger
`getOrCreateThread` is select-then-insert with no unique constraint; two concurrent
calls could create duplicate threads. On `/partnerships/[id]` `ContactBar` already
owns the trigger, so `MessageOwnerButton` must NOT also fire there. The prop keeps
exactly one trigger per page: ContactBar on the partnership page, MessageOwnerButton
on the member page.

## Acceptance criteria
- [ ] `ContactButtons` logged-out "Message" redirect URL now ends with the
  encoded `?contact=1` (e.g. `/auth?next=%2Fpartnerships%2F<id>%3Fcontact%3D1`).
- [ ] `MessageOwnerButton` logged-out "Message" redirect URL now appends
  `?contact=1` to `returnPath`.
- [ ] `MessageOwnerButton` gains an optional `autoContactOnReturn` prop; when true
  and the user is authenticated and `?contact=1` is present and they are not the
  owner, it calls `getOrCreateThread` once and navigates to `/messages/[threadId]`,
  removing `?contact=1` from the URL first (guarded by a ref, mirrors ContactBar).
- [ ] `/members/[id]` passes `autoContactOnReturn` so its standalone
  MessageOwnerButton auto-opens after auth (no ContactBar there).
- [ ] On `/partnerships/[id]` exactly one auto-open fires (ContactBar), i.e.
  MessageOwnerButton there does NOT self-trigger (prop omitted) — no duplicate thread.
- [ ] `npx next build` + typecheck pass; QA smoke exit 0 on the affected routes.

## Out of scope
- No changes to frozen auth files (`src/app/auth/**`, supabase libs).
- No change to `getOrCreateThread` / DB / schema.
- No Google OAuth (blocked on human Supabase config).
- No restyle of the buttons; behavior-only change.
