# Soft-save: push account, allow local fallback (slice 1)

**Lane:** `[want]` (last non-bug cycle `partnerships-browse-hub` pulled `[goal]`; last cycle PASSed → no blocker). Backlog item: **[P1][want] Soft-save: push account, allow local fallback** — slice 1 of 2.

## Goal
Stop turning logged-out heart-taps into a hard auth redirect; instead show an honest prompt that pushes free-account creation **but** lets the user "Skip — save on this device" (localStorage), so a logged-out visitor can actually save listings now and is nudged (not forced) toward an account.

## Scope (small, additive)
- **NEW** `src/lib/localSaves.ts` — SSR-safe localStorage helpers for device-saved listings (`{id, type}`): get / has / add / remove / count, plus a change event so multiple hearts stay in sync on one page.
- **NEW** `src/components/SoftSavePrompt.tsx` — a fixed centered modal (reuses the `SignUpGate` visual pattern: `fixed inset-0` backdrop, `rounded-2xl` card) offering **"Create a free account"** (→ `/auth?next=<current>`) and **"Skip — save on this device"**, with the honest device-only notice.
- **EDIT** `src/components/SaveListingButton.tsx` — when logged-out: reflect device-saved state on mount; clicking an unsaved listing opens the prompt; clicking an already-device-saved listing toggles it off locally (no modal). Logged-in behavior unchanged (still hits `toggleSavedListing`).

## Acceptance criteria
1. Logged-out heart-tap on an unsaved card/detail opens the soft-save modal (NOT an immediate `/auth` redirect); the modal offers Create-account and Skip-to-device, and shows the honest "Saved on this device only — not synced; you may lose them" notice.
2. Choosing **Skip — save on this device** fills the heart, persists the id to localStorage, and survives a page reload (heart stays filled for that listing while logged out).
3. Tapping an already-device-saved heart while logged out un-saves it (heart empties, removed from localStorage) with no modal.
4. **Create a free account** routes to `/auth?next=<current path>` (so the user returns to the listing; slice 2 will merge device saves into the account).
5. Logged-in users are unaffected — heart still toggles the `saved_listings` table via `toggleSavedListing`, no modal.
6. QA gate green: `/aircraft`, `/partnerships`, and a `/partnerships/[id]` detail return 200 with **zero** app-origin console errors and **zero** horizontal overflow at desktop 1280 + mobile 375; modal renders correctly (no overflow) when opened.

## Out of scope
- Merging device saves into the account on signup (**slice 2**).
- Showing device saves on `/saved` (it still redirects logged-out users to `/auth`).
- Any schema/DB change, any email, any change to `toggleSavedListing` or auth.
