# Soft-save slice 3 — surface device saves to logged-out visitors on /saved

**Lane:** `[want]` (P1). Last non-bug cycle (`make-hub-overview-prose`) was `[goal]` PASS →
this cycle is `[want]` per the 1:1 alternation. This is the explicit remaining slice of the
already-shipped `[P1][want]` "Soft-save: push account, allow local fallback" item:
> Slice 3 remaining: surface device saves to *logged-out* visitors directly on /saved
> (still redirects to /auth today) with the honest notice + "create an account to keep these."

## Goal
A logged-out visitor who soft-saved listings to this device (slice 1, localStorage) can now
**see those saved listings on `/saved`** — instead of being bounced to `/auth` — with an honest
"saved on this device only" notice and a prominent "Create a free account to keep these" CTA.

## Scope (small, additive)
- `src/app/actions.ts` — new server action `hydrateDeviceSaves(saves)` that sanitizes the
  device-save list (mirrors `mergeDeviceSaves`' validation), hydrates partnership + aircraft
  ids into card data (active-only, input order preserved), returns `{ partnerships, aircraft }`.
- `src/components/DeviceSavedListings.tsx` — NEW client component. On mount reads
  `getLocalSaves()`; if empty shows a logged-out empty state; else calls `hydrateDeviceSaves`,
  renders the honest device-only notice + account CTA + the saved cards (reusing
  `PartnershipCard`/`AircraftSaleCard`). Re-reads on `LOCAL_SAVES_EVENT` so un-saving a card
  here removes it live.
- `src/app/saved/page.tsx` — for logged-out users, render the page shell + `DeviceSavedListings`
  instead of `redirect('/auth?next=/saved')`. Logged-in path unchanged.

## Acceptance criteria
- [ ] Logged-out `/saved` no longer redirects to `/auth`; it returns HTTP 200 and renders.
- [ ] With device saves present, the saved partnership/aircraft cards render on `/saved`.
- [ ] An honest notice is shown: saved on this device only, not synced, may be lost — plus a
      "Create a free account to keep these" link to `/auth?next=/saved`.
- [ ] With NO device saves, a friendly empty state shows (browse links + sign-in prompt), no error.
- [ ] Un-saving a card on `/saved` (logged-out) removes it from the list without a reload.
- [ ] Logged-in `/saved` behaviour is unchanged (account-backed saves).
- [ ] `next build` + typecheck pass; QA smoke (1280 + 375) exits 0, no app console errors,
      no horizontal overflow; screenshots look right.

## Out of scope
- No schema/DB/SQL change. No change to `src/app/auth/**` or any FREEZE file.
- No change to the merge-on-login flow (slice 2) or the SoftSavePrompt (slice 1).
- No new colors/dependencies; sky accent only.
