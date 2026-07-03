# aircraft-message-draft-persist

## Goal
Let a logged-out visitor to an aircraft-for-sale listing type their message to the
seller BEFORE being sent to sign in, and have that exact message actually sent the
moment they return — instead of today's behavior (click "Message seller" → instant
redirect to `/auth` with nothing captured → sign in → land on an empty, unsent thread).

## Why this slice (Pillar 2 — frictionless signup)
GOAL.md's own guardrail: "A deferred signup gate must still capture the user at the
value moment... don't let someone do real work and then lose it because there was no
account." Today's `AircraftContactButton` doesn't just risk losing a draft — it never
even offers a compose box pre-auth, so a visitor's message is never captured at all.
This is the highest-value non-blocked Pillar 2 slice available (`?next=`/`?contact=1`
intent-preservation for the *thread* already exists; the *message text* does not) and
it requires zero changes to `src/app/auth/**`, Supabase client/server libs, or any
other frozen file — only the aircraft contact component + one tiny new localStorage
helper.

## Scope
- New `src/lib/messageDraft.ts` — tiny sessionStorage-backed helper (get/set/clear a
  single pending draft keyed by `aircraft:<id>`), mirroring the style of
  `src/lib/localSaves.ts` (SSR-safe guards, try/catch around storage access).
- `src/components/AircraftContactButton.tsx` — replace the immediate-redirect
  "Message seller" button with an inline expand-to-compose textarea:
  - Logged out: typing + hitting Send stores the draft, then redirects to
    `/auth?next=<listingPath>?contact=1` (same pattern as today).
  - Logged in: typing + hitting Send calls `getOrCreateAircraftThread` then
    `sendMessage(threadId, text)` directly, then navigates to `/messages/[id]`.
  - On return from auth (`?contact=1`, existing auto-contact effect): after the
    thread is created, if a saved draft exists for this listing, send it via
    `sendMessage` before navigating to the thread; clear the draft either way so it
    can never double-send on a later visit.
- No schema change. No other contact component touched this cycle (partnership
  desktop/mobile bars, seeker contact bar) — noted as a follow-up slice.

## Acceptance criteria
- Logged out, on an aircraft listing detail page: clicking "Message seller" expands
  an inline textarea (no navigation yet); typing text and clicking Send navigates to
  `/auth?next=...&contact=1` and the typed text is persisted (survives full reload).
- Signing in and returning to the listing with `?contact=1` auto-creates the thread
  AND sends the previously-typed message automatically (visible in `/messages/[id]`
  without retyping); the stored draft is cleared after sending.
- Logged in, typing a message and clicking Send creates the thread (or reuses an
  existing one) and sends that exact message in one step, landing on `/messages/[id]`.
- Leaving the textarea empty and clicking "Message seller" with no text behaves
  sanely (button disabled / no-op) — no empty message can be sent.
- No console errors, no horizontal overflow at 1280/375, `next build` + typecheck
  green.
- Existing "this is your listing" owner view is unchanged.

## Out of scope
- Partnership `ContactBar`/`ContactButtons`, `MessageOwnerButton` (seed personas), and
  `SeekerContactBar` — same gap exists there; left for a follow-up cycle to keep this
  slice small and reviewable.
- Any change to `/auth`, Supabase clients, or the `sendMessage`/`getOrCreate*Thread`
  server actions themselves (reused as-is).
- Rich text, attachments, or read-receipts in the composer — plain textarea only,
  matching `MessageThread`'s existing compose UI.
