# Soft-save slice 2 — merge device saves into the account on login

**Lane:** `[want]` (P1). Last non-bug cycle (`make-model-state-faqs`) pulled `[goal]`
and PASSed (no blocker), so `[want]` is owed. This is the explicit slice-2 promise
written into slice 1's user-facing notice ("Saved on this device only … Slice 2 will
merge these into the user's account on signup").

## Goal
When a soft-save user (device-only saves in localStorage) signs in or signs up,
automatically and idempotently merge their device saves into their real account
(`saved_listings`), then clear the device store — so the honest "you may lose them"
notice from slice 1 is made good.

## Scope (small, additive)
- `src/lib/localSaves.ts` — add a `clearLocalSaves()` helper (mirrors existing `write`).
- `src/app/actions.ts` — add a `mergeDeviceSaves(saves)` server action: sanitize +
  cap the payload, skip already-saved rows, batch-insert the rest for the logged-in
  user, return `{ merged: N }`. Reuses the existing `saved_listings` table + types.
- `src/components/DeviceSaveSync.tsx` — NEW client component, renders only a small
  dismissible confirmation toast. On mount and on `auth → signed-in`, reads device
  saves, calls `mergeDeviceSaves`, clears the device store, and `router.refresh()`es
  so the just-merged hearts/`/saved` reflect the account state.
- `src/app/layout.tsx` — mount `<DeviceSaveSync />` once globally (next to the
  existing global `FeedbackWidget`), so the merge happens wherever a fresh signup lands.

## Acceptance criteria
- A logged-out visitor with N device saves who then signs in has those N rows in
  `saved_listings` and an empty `ch_local_saves` localStorage key afterward.
- Merge is idempotent: rows already saved to the account are not duplicated; running
  twice inserts nothing the second time (no error, `merged: 0`).
- The payload is sanitized server-side (only `partnership`/`aircraft` types, deduped,
  count-capped) so a tampered localStorage can't write junk.
- A logged-in user with no device saves sees nothing (no toast, no network write).
- After merge, `/saved` shows the merged listings (via `router.refresh()` +
  `revalidatePath('/saved')`); the heart on cards reflects saved state.
- `next build` + typecheck green; QA smoke PASS (HTTP 200, no app console errors, no
  375px/1280 overflow) on the affected pages; screenshots look right.

## Out of scope
- Surfacing device saves to *logged-out* visitors directly on `/saved` (still
  redirects to `/auth`) — the next slice.
- Any change to the auth callback / `src/app/auth/**` (FREEZE): the merge is driven
  client-side from the already-signed-in session, touching no auth files.
- No schema/DB/SQL change, no new dependency, no new color.
