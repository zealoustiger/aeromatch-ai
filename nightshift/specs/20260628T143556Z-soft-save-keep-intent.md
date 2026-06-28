# soft-save-keep-intent — preserve the hearted listing across signup

**Pillar 2 (frictionless signup/auth).** Cycle: 2026-06-28T143556Z.

## Goal
When a logged-out visitor hearts a listing and chooses "Create a free account," the
listing they just tried to save must survive the auth round-trip and land in their
account — instead of being silently lost.

## The bug (intent drop)
`SaveListingButton.handleClick` opens `SoftSavePrompt` but does **not** persist the
listing. Only the "Skip — save on this device" button (`onSkip` → `addLocalSave`)
writes to localStorage. So if the user clicks the **primary** CTA "Create a free
account," they go to `/auth?next=<listing>` with **nothing in the device store**. On
return, the globally-mounted `DeviceSaveSync` calls `mergeDeviceSaves(getLocalSaves())`
— which is empty — so the save the user explicitly asked for is never created. They
come back to an empty heart. This directly violates Pillar 2's "persist intent across
auth."

## Fix
Before navigating to `/auth` from the "Create a free account" link, write the listing
to the device store (`addLocalSave`). `DeviceSaveSync` already merges the device store
into the new account on return (and clears it), so this reuses the entire existing
pipeline — **no schema, no new server action, no new query.**

## Scope (files)
- `src/components/SoftSavePrompt.tsx` — add an `onCreateAccount` prop; fire it on the
  "Create a free account" link's `onClick` (synchronous, before client navigation).
- `src/components/SaveListingButton.tsx` — pass `onCreateAccount={() => addLocalSave(...)}`.

## Acceptance criteria
- [ ] Clicking "Create a free account" in the soft-save prompt writes the listing to
      the device store before navigating to `/auth?next=…` (so `mergeDeviceSaves` picks
      it up on return).
- [ ] The "Skip — save on this device" path is unchanged (still `addLocalSave` via `onSkip`).
- [ ] The `?next=` value (pathname + query) is unchanged — intent destination preserved.
- [ ] No change to the frozen `/auth` page, `supabase-*`, or any server action.
- [ ] `npx next build` + typecheck pass; QA smoke (HTTP 200 / no app console errors /
      no horizontal overflow) passes on an affected listing page at 1280 + 375.

## Out of scope
- Touching `/auth`, OAuth, or the signup form (frozen).
- A server-side `?save=` intent marker for storage-disabled browsers (Slice B — separate cycle).
- Any change to `mergeDeviceSaves`, `toggleSavedListing`, or the schema.
