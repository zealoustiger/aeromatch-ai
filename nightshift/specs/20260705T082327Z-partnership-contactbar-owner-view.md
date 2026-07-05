# partnership-contactbar-owner-view

## Goal
Show a neutral "this is your listing" note instead of a broken self-contact box when a partnership listing's owner views their own listing's detail page.

## Scope
- `src/components/ContactBar.tsx` (mobile sticky contact bar on `/partnerships/[id]`)
- `src/components/ContactButtons.tsx` (desktop sidebar contact box on `/partnerships/[id]`)

Both already receive `posterId` and already track `user` via the same Supabase auth effect used in `AircraftContactButton`/`SeekerContactBar`. Neither currently early-returns when `user?.id === posterId`: `showMessage` correctly hides the Message button for the owner, but `showEmail`/`showPhone` don't check ownership, so an owner viewing their own listing sees "Email"/"Call" buttons that mailto/tel themselves.

Mirror the exact, already-established pattern from `AircraftContactButton.tsx` (lines 78-85) and `SeekerContactBar.tsx` (lines 89-96): add an early return, placed after the existing hooks (so hook order is unchanged) and before `handleSend`, rendering:

```
<p className="text-sm text-slate-500">
  This is your listing. Interested buyers can message you once they sign in.
</p>
```

## Acceptance criteria
- Logged-in owner viewing their own `/partnerships/[id]` listing sees the neutral note (both the desktop `ContactButtons` box and the mobile sticky `ContactBar`) instead of Email/Call/Message buttons.
- Non-owner (logged in or logged out) viewing the same listing sees the unchanged existing behavior (Message/Email/Call as before).
- Seed/concierge listings (`isSeed`) on `ContactBar` are unaffected by this change (they have no real `posterId` a normal member would match).
- `npx next build` compiles clean, no new TypeScript errors.
- No console errors, no horizontal overflow at desktop 1280 / mobile 375 on `/partnerships/[id]`.

## Out of scope
- Any change to `SeekerContactBar.tsx` / `AircraftContactButton.tsx` (already correct).
- Any change to messaging/auth logic itself.
- Any change to the seed/persona contact path (`MessageOwnerButton`).
